import { after } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enqueueIndexDocument } from "@/lib/jobs/queue";
import { runPendingJobs } from "@/lib/jobs/run";
import { getStorageFileNameError, getStorageUploadError } from "@/lib/validation/document";

const ALLOWED = new Map([
  ["application/pdf", "pdf"],
  ["text/plain", "txt"],
  ["text/markdown", "md"],
]);

function fileTypeFromName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || extension === "txt" || extension === "md") {
    return extension;
  }
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  if (profile.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can upload knowledge documents." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const fileType = ALLOWED.get(file.type) ?? fileTypeFromName(file.name);

  if (!fileType) {
    return NextResponse.json(
      { error: "Upload a PDF, Markdown, or TXT file." },
      { status: 400 },
    );
  }

  const fileNameError = getStorageFileNameError(file.name);
  if (fileNameError) {
    return NextResponse.json({ error: fileNameError }, { status: 400 });
  }

  const { data: document, error: insertError } = await supabase
    .from("knowledge_documents")
    .insert({
      organization_id: profile.organization_id,
      name: file.name,
      file_type: fileType,
      status: "queued",
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !document) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not create document." },
      { status: 500 },
    );
  }

  const path = `${profile.organization_id}/${document.id}/${file.name}`;
  const { error: storageError } = await supabase.storage
    .from("knowledge")
    .upload(path, file, { upsert: false });

  if (storageError) {
    await supabase
      .from("knowledge_documents")
      .update({ status: "failed", error_message: getStorageUploadError(storageError.message, file.name) })
      .eq("id", document.id);
    return NextResponse.json(
      { error: getStorageUploadError(storageError.message, file.name) },
      { status: 400 },
    );
  }

  await supabase
    .from("knowledge_documents")
    .update({ file_path: path, status: "queued" })
    .eq("id", document.id);

  await enqueueIndexDocument(profile.organization_id, document.id);
  after(() => {
    void runPendingJobs();
  });

  return NextResponse.json({ ok: true, id: document.id, queued: true });
}
