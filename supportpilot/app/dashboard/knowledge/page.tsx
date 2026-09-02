import { DocumentList } from "@/components/knowledge/document-list";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { UploadDropzone } from "@/components/knowledge/upload-dropzone";
import { getCurrentUser, listDocuments } from "@/lib/data";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const documents = await listDocuments(user.organization_id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="typo-heading-1">Knowledge base</h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          Company policies, FAQs, and product docs that ground every copilot draft.
        </p>
      </div>
      <ProcessingStatus />
      <UploadDropzone />
      <DocumentList documents={documents} />
    </div>
  );
}
