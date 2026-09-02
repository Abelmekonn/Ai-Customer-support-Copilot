import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { documentId } = await params;
  const supabase = await createClient();
  const { data: document } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", documentId)
    .eq("organization_id", user.organization_id)
    .single();

  if (!document) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <p className="text-xs text-muted-foreground">Document</p>
        <h1 className="mt-1 typo-heading-1">{document.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={document.status === "indexed" ? "default" : "secondary"}>
            {document.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {document.file_type.toUpperCase()}
          </span>
        </div>
      </div>
      {document.error_message ? (
        <p className="text-sm text-destructive">{document.error_message}</p>
      ) : null}
      <ProcessingStatus current={document.status} />
    </div>
  );
}
