import { extractText, getDocumentProxy } from "unpdf";
import type { PageText } from "@/lib/knowledge/chunk";

export async function extractDocumentPages(
  bytes: Uint8Array,
  fileType: string,
): Promise<PageText[]> {
  if (fileType === "txt" || fileType === "md") {
    const text = new TextDecoder("utf-8").decode(bytes);
    return [{ text, pageNumber: null }];
  }

  if (fileType !== "pdf") {
    throw new Error("Upload a PDF, Markdown, or TXT file.");
  }

  const pdf = await getDocumentProxy(bytes);
  const extracted = await extractText(pdf, { mergePages: false });
  return extracted.text.map((text, index) => ({
    text,
    pageNumber: index + 1,
  }));
}
