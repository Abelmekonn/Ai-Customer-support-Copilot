"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
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

  if (status === "indexed") return null;

  const inFlight =
    status === "queued" ||
    status === "uploading" ||
    status === "extracting" ||
    status === "chunking" ||
    status === "embedding";

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
      setError(payload.error ?? "Indexing failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={onRetry}
        disabled={pending || inFlight}
        className="rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium text-white/80 hover:bg-white/8 disabled:opacity-60"
      >
        {pending || inFlight ? "Indexing…" : "Retry indexing"}
      </button>
      {error ? <p className="max-w-[16rem] text-right text-[12px] text-primary">{error}</p> : null}
    </div>
  );
}
