import { isIndexing } from "@/lib/knowledge/pipeline";
import type { KnowledgeDocument } from "@/lib/types";

export type LibraryShelf = "all" | "ready" | "indexing" | "failed";
export type LibraryKind = "all" | "pdf" | "md" | "txt";
export type LibrarySort = "newest" | "name";

export type LibraryQuery = {
  q: string;
  shelf: LibraryShelf;
  type: LibraryKind;
  sort: LibrarySort;
};

export function parseLibraryQuery(params: {
  q?: string;
  shelf?: string;
  type?: string;
  sort?: string;
}): LibraryQuery {
  return {
    q: (params.q ?? "").trim(),
    shelf: params.shelf === "ready" || params.shelf === "indexing" || params.shelf === "failed" ? params.shelf : "all",
    type: params.type === "pdf" || params.type === "md" || params.type === "txt" ? params.type : "all",
    sort: params.sort === "name" ? "name" : "newest",
  };
}

export function documentKind(fileType: string): Exclude<LibraryKind, "all"> | "other" {
  const value = fileType.toLowerCase();
  if (value === "pdf" || value.includes("pdf")) return "pdf";
  if (value === "md" || value.includes("markdown")) return "md";
  if (value === "txt" || value.includes("plain")) return "txt";
  return "other";
}

export function libraryHref(query: Partial<LibraryQuery> & { q?: string }) {
  const params = new URLSearchParams();
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.shelf && query.shelf !== "all") params.set("shelf", query.shelf);
  if (query.type && query.type !== "all") params.set("type", query.type);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `/dashboard/knowledge?${qs}` : "/dashboard/knowledge";
}

export function filterLibrary(documents: KnowledgeDocument[], query: LibraryQuery) {
  const needle = query.q.toLowerCase();
  const filtered = documents.filter((document) => {
    if (query.shelf === "ready" && document.status !== "indexed") return false;
    if (query.shelf === "indexing" && !isIndexing(document.status)) return false;
    if (query.shelf === "failed" && document.status !== "failed") return false;
    if (query.type !== "all" && documentKind(document.file_type) !== query.type) return false;
    if (!needle) return true;
    return `${document.name} ${document.file_type} ${document.error_message ?? ""}`.toLowerCase().includes(needle);
  });

  return [...filtered].sort((a, b) => {
    if (query.sort === "name") return a.name.localeCompare(b.name);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function groupLibrary(documents: KnowledgeDocument[]) {
  return {
    indexing: documents.filter((document) => isIndexing(document.status)),
    ready: documents.filter((document) => document.status === "indexed"),
    failed: documents.filter((document) => document.status === "failed"),
  };
}

export function presentKinds(documents: KnowledgeDocument[]) {
  const set = new Set(documents.map((document) => documentKind(document.file_type)));
  return (["pdf", "md", "txt"] as const).filter((kind) => set.has(kind));
}
