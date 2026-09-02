import { after } from "next/server";
import { NextResponse } from "next/server";
import { enqueueIndexDocument } from "@/lib/jobs/queue";
import { runPendingJobs } from "@/lib/jobs/run";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { documentId?: string } | null;
  const documentId = body?.documentId;
  if (!documentId) {
    return NextResponse.json({ error: "Missing document." }, { status: 400 });
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
      { error: "Only admins can retry indexing." },
      { status: 403 },
    );
  }

  const { data: document } = await supabase
    .from("knowledge_documents")
    .select("id")
    .eq("id", documentId)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  await supabase
    .from("knowledge_documents")
    .update({ status: "queued", error_message: null })
    .eq("id", documentId)
    .eq("organization_id", profile.organization_id);

  await enqueueIndexDocument(profile.organization_id, documentId);
  after(() => {
    void runPendingJobs();
  });

  return NextResponse.json({ ok: true, queued: true });
}
