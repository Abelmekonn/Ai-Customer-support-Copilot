import { notFound } from "next/navigation";
import { DeleteDocumentButton } from "@/components/knowledge/delete-document-button";
import { IndexingPoller } from "@/components/knowledge/indexing-poller";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { RetryIndexButton } from "@/components/knowledge/retry-index-button";
import { canManageKnowledge } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#0a0a0a]">
      <IndexingPoller statuses={[document.status]} />
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-7 pb-16">
        <Link href="/dashboard/knowledge" className="text-[13px] text-white/40 hover:text-white">
          Knowledge
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="typo-heading-1">{document.name}</h1>
            <p className="mt-2 text-[14px] text-white/45">{document.file_type.toUpperCase()}</p>
          </div>
          {canManageKnowledge(user.role) ? (
            <div className="flex items-center gap-2">
              <RetryIndexButton documentId={document.id} status={document.status} />
              <DeleteDocumentButton documentId={document.id} />
            </div>
          ) : null}
        </div>
        <section className="rounded-2xl bg-[#111] p-5">
          <ProcessingStatus
            current={document.status}
            fileName={document.name}
            error={document.error_message}
          />
        </section>
      </div>
    </div>
  );
}
