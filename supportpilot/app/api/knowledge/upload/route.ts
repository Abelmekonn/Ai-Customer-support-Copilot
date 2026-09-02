import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const fileType =
    ALLOWED.get(file.type) ?? fileTypeFromName(file.name);

  if (!fileType) {
    return NextResponse.json(
      { error: "Upload a PDF, Markdown, or TXT file." },
      { status: 400 },
    );
  }

  const { data: document, error: insertError } = await supabase
    .from("knowledge_documents")
    .insert({
      organization_id: profile.organization_id,
      name: file.name,
      file_type: fileType,
      status: "uploading",
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
      .update({ status: "failed", error_message: storageError.message })
      .eq("id", document.id);
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  await supabase
    .from("knowledge_documents")
    .update({ file_path: path, status: "uploading" })
    .eq("id", document.id);

  return NextResponse.json({ ok: true, id: document.id });
}
