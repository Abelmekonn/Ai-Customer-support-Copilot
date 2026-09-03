"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { isIndexing } from "@/lib/knowledge/pipeline";
import type { DocumentStatus } from "@/lib/types";

export function RetryIndexButton({
  documentId,
  status,
}: {
  documentId: string;
  status: DocumentStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "indexed" || isIndexing(status)) return null;

  async function onRetry(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setError(null);
    const response = await fetch("/api/knowledge/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not restart indexing. Try again in a moment.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={onRetry}
        disabled={pending}
        className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-primary/20 disabled:opacity-60"
      >
        {pending ? "Retrying…" : "Retry indexing"}
      </button>
      {error ? <p className="max-w-[16rem] text-right text-[12px] text-primary">{error}</p> : null}
    </div>
  );
}
