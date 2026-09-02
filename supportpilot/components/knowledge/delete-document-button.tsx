"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteKnowledgeDocumentAction } from "@/app/dashboard/knowledge/actions";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm("Delete this document and its indexed chunks?")) return;
    setPending(true);
    setError(null);
    const result = await deleteKnowledgeDocumentAction(documentId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/knowledge");
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="outline" size="sm" onClick={onDelete} disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
    </div>
  );
}
