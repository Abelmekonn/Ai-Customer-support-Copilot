export type PageText = {
  text: string;
  pageNumber: number | null;
};

export type KnowledgeChunk = {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
};

const DEFAULT_SIZE = 900;
const DEFAULT_OVERLAP = 120;

export function chunkPages(
  pages: PageText[],
  size = DEFAULT_SIZE,
  overlap = DEFAULT_OVERLAP,
): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  for (const page of pages) {
    const text = normalizeText(page.text);
    if (!text) continue;

    const pieces = splitToSize(text, size, overlap);
    for (const content of pieces) {
      chunks.push({
        content,
        chunkIndex: chunks.length,
        pageNumber: page.pageNumber,
      });
    }
  }

  return chunks;
}

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function splitToSize(text: string, size: number, overlap: number) {
  if (text.length <= size) return [text];

  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const windows: string[] = [];
  let current = "";

  function flush() {
    if (current) windows.push(current.trim());
    current = "";
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > size) {
      flush();
      windows.push(...hardSplit(paragraph, size, overlap));
      continue;
    }
    if (!current) {
      current = paragraph;
      continue;
    }
    if (`${current}\n\n${paragraph}`.length <= size) {
      current = `${current}\n\n${paragraph}`;
    } else {
      flush();
      current = paragraph;
    }
  }
  flush();
  return windows;
}

function hardSplit(text: string, size: number, overlap: number) {
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    parts.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return parts.filter(Boolean);
}
