import { describe, expect, it } from "vitest";
import { filterLibrary, groupLibrary, libraryHref, parseLibraryQuery } from "@/lib/knowledge/library";
import type { KnowledgeDocument } from "@/lib/types";

function doc(overrides: Partial<KnowledgeDocument>): KnowledgeDocument {
  return {
    id: overrides.id ?? "1",
    organization_id: "org",
    name: overrides.name ?? "policy.pdf",
    file_path: "path",
    file_type: overrides.file_type ?? "pdf",
    status: overrides.status ?? "indexed",
    error_message: overrides.error_message ?? null,
    uploaded_by: null,
    created_at: overrides.created_at ?? "2026-09-03T00:00:00.000Z",
    updated_at: "2026-09-03T00:00:00.000Z",
  };
}

describe("parseLibraryQuery", () => {
  it("defaults to the full library", () => {
    expect(parseLibraryQuery({})).toEqual({ q: "", shelf: "all", type: "all", sort: "newest" });
    expect(parseLibraryQuery({ shelf: "ready", type: "md", sort: "name", q: " refund " })).toEqual({
      q: "refund",
      shelf: "ready",
      type: "md",
      sort: "name",
    });
  });
});

describe("filterLibrary", () => {
  const docs = [
    doc({ id: "a", name: "Refund policy.pdf", file_type: "pdf", status: "indexed", created_at: "2026-09-02T00:00:00.000Z" }),
    doc({ id: "b", name: "shipping.md", file_type: "md", status: "embedding", created_at: "2026-09-03T00:00:00.000Z" }),
    doc({ id: "c", name: "old.txt", file_type: "txt", status: "failed", created_at: "2026-08-01T00:00:00.000Z" }),
  ];

  it("searches name and keeps shelf plus type filters", () => {
    const found = filterLibrary(docs, { q: "refund", shelf: "all", type: "all", sort: "newest" });
    expect(found.map((row) => row.id)).toEqual(["a"]);
    const pdfs = filterLibrary(docs, { q: "", shelf: "ready", type: "pdf", sort: "name" });
    expect(pdfs.map((row) => row.id)).toEqual(["a"]);
  });

  it("sorts by name when asked", () => {
    const named = filterLibrary(docs, { q: "", shelf: "all", type: "all", sort: "name" });
    expect(named.map((row) => row.name)).toEqual(["old.txt", "Refund policy.pdf", "shipping.md"]);
  });
});

describe("groupLibrary", () => {
  it("splits into indexing, ready, and failed shelves", () => {
    const grouped = groupLibrary([
      doc({ id: "1", status: "indexed" }),
      doc({ id: "2", status: "chunking" }),
      doc({ id: "3", status: "failed" }),
    ]);
    expect(grouped.ready).toHaveLength(1);
    expect(grouped.indexing).toHaveLength(1);
    expect(grouped.failed).toHaveLength(1);
  });
});

describe("libraryHref", () => {
  it("omits default params", () => {
    expect(libraryHref({ q: "", shelf: "all", type: "all", sort: "newest" })).toBe("/dashboard/knowledge");
    expect(libraryHref({ q: "faq", shelf: "ready", type: "pdf", sort: "name" })).toBe(
      "/dashboard/knowledge?q=faq&shelf=ready&type=pdf&sort=name",
    );
  });
});
