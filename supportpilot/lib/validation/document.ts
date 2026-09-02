import { z } from "zod";

export const documentFileTypeSchema = z.enum(["pdf", "txt", "md"]);

export const createDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  fileType: documentFileTypeSchema,
});

const SAFE_FILE_STEM = /^[A-Za-z0-9._-]+$/;

export function getStorageFileNameError(fileName: string): string | null {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "";
  if (!base) return "Choose a file to upload.";

  const extension = base.includes(".") ? base.slice(base.lastIndexOf(".") + 1) : "";
  const stem = extension ? base.slice(0, base.lastIndexOf(".")) : base;

  if (SAFE_FILE_STEM.test(stem) && /^(pdf|txt|md)$/i.test(extension)) {
    return null;
  }

  const reasons: string[] = [];
  if (/\s/.test(base)) reasons.push("spaces");
  if (/[^A-Za-z0-9._\s-]/.test(base)) reasons.push("special characters");

  const reasonText =
    reasons.length === 2
      ? "it contains spaces and special characters"
      : reasons.length === 1
        ? `it contains ${reasons[0]}`
        : "this name isn’t allowed";

  return `“${base}” can’t be uploaded because ${reasonText}. Rename the file using only letters, numbers, hyphens, and underscores — for example, task-report-july-2026.pdf — then upload it again.`;
}

export function getStorageUploadError(message: string, fileName: string): string {
  if (/invalid key/i.test(message)) {
    return (
      getStorageFileNameError(fileName) ??
      "This file name can’t be stored. Rename it using only letters, numbers, hyphens, and underscores, then upload it again."
    );
  }
  return message;
}
