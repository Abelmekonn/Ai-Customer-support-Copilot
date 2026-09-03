"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { getStorageFileNameError } from "@/lib/validation/document";

const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain,text/markdown";

export function UploadDropzone() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const fileNameError = getStorageFileNameError(file.name);
    if (fileNameError) {
      setError(fileNameError);
      return;
    }

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
      setError(payload.error ?? "Could not store the file. Try again, or rename it and retry.");
      return;
    }

    router.refresh();
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#111] px-6 py-10 text-center">
      <Upload className="size-6 text-primary" />
      <p className="mt-3 text-[15px] font-medium">
        {pending ? "Storing the file…" : "Drop a PDF, Markdown, or text file"}
      </p>
      <p className="mt-1 max-w-md text-[13px] leading-5 text-white/40">
        {pending
          ? "Upload is saved first. The Queued → Indexed steps will appear on the document below."
          : "The file is stored immediately. Indexing then runs through Queued, Extracting, Chunking, Embedding, Indexed."}
      </p>
      {error ? (
        <p className="mt-3 max-w-md text-[14px] leading-6 text-primary" role="alert">
          {error}
        </p>
      ) : null}
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
