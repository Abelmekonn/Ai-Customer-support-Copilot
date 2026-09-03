import { IndexingPoller } from "@/components/knowledge/indexing-poller";
import { KnowledgeLibrary } from "@/components/knowledge/knowledge-library";
import { KnowledgeSearch } from "@/components/knowledge/knowledge-search";
import { canManageKnowledge } from "@/lib/auth/roles";
import { parseLibraryQuery } from "@/lib/knowledge/library";
import { getCurrentUser, listDocuments } from "@/lib/data";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shelf?: string; type?: string; sort?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const query = parseLibraryQuery(await searchParams);
  const documents = await listDocuments(user.organization_id);

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#0a0a0a]">
      <IndexingPoller statuses={documents.map((document) => document.status)} />
      <div className="border-b border-white/[0.06] px-6 py-3">
        <KnowledgeSearch query={query} />
      </div>
      <div className="mx-auto max-w-[1200px] px-6 py-7 pb-16">
        <KnowledgeLibrary
          documents={documents}
          query={query}
          canManage={canManageKnowledge(user.role)}
        />
      </div>
    </div>
  );
}
