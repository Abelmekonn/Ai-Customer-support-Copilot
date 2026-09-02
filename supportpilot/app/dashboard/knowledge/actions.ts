"use server";

import { revalidatePath } from "next/cache";
import { canManageKnowledge } from "@/lib/auth/roles";
import { requireUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function deleteKnowledgeDocumentAction(documentId: string) {
  const user = await requireUser();
  if (!canManageKnowledge(user.role)) {
    return { error: "Only admins can delete knowledge documents." };
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("knowledge_documents")
    .select("id, file_path")
    .eq("id", documentId)
    .eq("organization_id", user.organization_id)
    .maybeSingle();

  if (!document) {
    return { error: "Document not found." };
  }

  if (document.file_path) {
    await supabase.storage.from("knowledge").remove([document.file_path]);
  }

  const { error } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", user.organization_id);

  if (error) {
    return { error: "Could not delete this document. Try again." };
  }

  revalidatePath("/dashboard/knowledge");
  revalidatePath(`/dashboard/knowledge/${documentId}`);
  return { ok: true };
}
