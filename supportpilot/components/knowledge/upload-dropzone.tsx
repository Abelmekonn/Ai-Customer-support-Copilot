"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";

const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain,text/markdown";

export function UploadDropzone() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/knowledge/upload", {
      method: "POST",
      body,
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }

    router.refresh();
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-[#111] px-6 py-10 text-center">
      <Upload className="size-6 text-primary" />
      <p className="mt-3 text-sm font-medium">
        {pending ? "Uploading…" : "Drop a PDF, Markdown, or text file"}
      </p>
      <p className="mt-1 max-w-md text-[13px] text-steel">
        Files are stored in your workspace. Extraction, chunking, and embeddings
        are the next stage.
      </p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <input
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={pending}
        onChange={(event) => {
          void onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}
