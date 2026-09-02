import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DeleteDocumentButton } from "@/components/knowledge/delete-document-button";
import { IndexingPoller } from "@/components/knowledge/indexing-poller";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { RetryIndexButton } from "@/components/knowledge/retry-index-button";
import { canManageKnowledge } from "@/lib/auth/roles";
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
    <div className="h-full min-h-0 w-full space-y-6 overflow-y-auto p-6">
      <IndexingPoller statuses={[document.status]} />
      <div>
        <p className="text-xs text-muted-foreground">Document</p>
        <h1 className="mt-1 typo-heading-1">{document.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={document.status === "indexed" ? "default" : document.status === "failed" ? "high" : "secondary"}>
            {document.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {document.file_type.toUpperCase()}
          </span>
          {canManageKnowledge(user.role) ? (
            <>
              <RetryIndexButton documentId={document.id} status={document.status} />
              <DeleteDocumentButton documentId={document.id} />
            </>
          ) : null}
        </div>
      </div>
      {document.error_message ? (
        <p className="text-sm text-destructive">{document.error_message}</p>
      ) : null}
      <ProcessingStatus current={document.status} />
    </div>
  );
}
