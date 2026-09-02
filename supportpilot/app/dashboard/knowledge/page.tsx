import { DocumentList } from "@/components/knowledge/document-list";
import { IndexingPoller } from "@/components/knowledge/indexing-poller";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { UploadDropzone } from "@/components/knowledge/upload-dropzone";
import { getCurrentUser, listDocuments } from "@/lib/data";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const documents = await listDocuments(user.organization_id);

  return (
    <div className="h-full min-h-0 w-full space-y-8 overflow-y-auto p-6">
      <IndexingPoller statuses={documents.map((document) => document.status)} />
      <div>
        <h1 className="typo-heading-1">Knowledge base</h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          Company policies, FAQs, and product docs that ground every copilot draft.
        </p>
      </div>
      <ProcessingStatus current={documents[0]?.status} />
      <UploadDropzone />
      <DocumentList documents={documents} />
    </div>
  );
}
