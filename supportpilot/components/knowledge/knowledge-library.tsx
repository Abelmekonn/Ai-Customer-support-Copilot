import type { ReactNode } from "react";
import Link from "next/link";
import { DocumentCards, DocumentRows } from "@/components/knowledge/document-list";
import { UploadDropzone } from "@/components/knowledge/upload-dropzone";
import {
  filterLibrary,
  groupLibrary,
  libraryHref,
  presentKinds,
  type LibraryKind,
  type LibraryQuery,
  type LibraryShelf,
} from "@/lib/knowledge/library";
import { isIndexing } from "@/lib/knowledge/pipeline";
import type { KnowledgeDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

const SHELVES: { id: LibraryShelf; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "indexing", label: "Indexing" },
  { id: "failed", label: "Failed" },
];

const KINDS: { id: LibraryKind; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "pdf", label: "PDF" },
  { id: "md", label: "Markdown" },
  { id: "txt", label: "Text" },
];

export function KnowledgeLibrary({
  documents,
  query,
  canManage,
}: {
  documents: KnowledgeDocument[];
  query: LibraryQuery;
  canManage: boolean;
}) {
  const indexed = documents.filter((document) => document.status === "indexed").length;
  const indexing = documents.filter((document) => isIndexing(document.status)).length;
  const failed = documents.filter((document) => document.status === "failed").length;
  const visible = filterLibrary(documents, query);
  const groups = groupLibrary(visible);
  const kinds = presentKinds(documents);
  const grouped = query.shelf === "all" && !query.q;
  const emptyLibrary = documents.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="typo-heading-1">Knowledge</h1>
        <p className="mt-2 text-[14px] text-white/45">
          The policy library for this workspace. Search, then open a file. Drafts cite what is indexed here.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Ready to cite"
          value={String(indexed)}
          hint={indexed > 0 ? "Indexed files" : "Upload a policy"}
          href={libraryHref({ ...query, shelf: "ready" })}
          active={query.shelf === "ready"}
        />
        <Kpi
          label="Indexing"
          value={String(indexing)}
          hint={indexing > 0 ? "Open a file to watch the steps" : "Nothing in the pipeline"}
          href={libraryHref({ ...query, shelf: "indexing" })}
          active={query.shelf === "indexing"}
        />
        <Kpi
          label="Failed"
          value={String(failed)}
          hint={failed > 0 ? "Retry on the file" : "No failures"}
          href={libraryHref({ ...query, shelf: "failed" })}
          active={query.shelf === "failed"}
        />
      </div>

      {canManage ? (
        <UploadDropzone />
      ) : (
        <p className="text-[14px] text-white/40">Only admins can upload or delete knowledge documents.</p>
      )}

      {emptyLibrary ? (
        <p className="text-[14px] text-white/40">
          The library is empty. After a file is stored, it appears here under Indexing, then Ready.
        </p>
      ) : (
        <section className="rounded-2xl bg-[#111] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-medium">Library</h2>
              <p className="mt-0.5 text-[13px] text-white/35">
                {visible.length === documents.length
                  ? `${visible.length} ${visible.length === 1 ? "file" : "files"}`
                  : `${visible.length} of ${documents.length}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SHELVES.map((shelf) => (
                <FilterChip
                  key={shelf.id}
                  href={libraryHref({ ...query, shelf: shelf.id })}
                  active={query.shelf === shelf.id}
                  label={shelf.label}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {KINDS.filter((kind) => kind.id === "all" || kinds.includes(kind.id)).map((kind) => (
                <FilterChip
                  key={kind.id}
                  href={libraryHref({ ...query, type: kind.id })}
                  active={query.type === kind.id}
                  label={kind.label}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                href={libraryHref({ ...query, sort: "newest" })}
                active={query.sort === "newest"}
                label="Newest"
              />
              <FilterChip
                href={libraryHref({ ...query, sort: "name" })}
                active={query.sort === "name"}
                label="Name"
              />
            </div>
          </div>
        </section>
      )}

      {emptyLibrary ? null : visible.length === 0 ? (
        <p className="text-[14px] text-white/40">No files match that search.</p>
      ) : grouped ? (
        <div className="flex flex-col gap-6">
          {groups.indexing.length > 0 ? (
            <Shelf title="Indexing" count={groups.indexing.length}>
              <DocumentRows documents={groups.indexing} canManage={canManage} />
            </Shelf>
          ) : null}
          {groups.failed.length > 0 ? (
            <Shelf title="Needs attention" count={groups.failed.length}>
              <DocumentRows documents={groups.failed} canManage={canManage} />
            </Shelf>
          ) : null}
          {groups.ready.length > 0 ? (
            <Shelf title="Ready to cite" count={groups.ready.length}>
              <DocumentCards documents={groups.ready} canManage={canManage} />
            </Shelf>
          ) : null}
        </div>
      ) : query.shelf === "ready" ? (
        <DocumentCards documents={visible} canManage={canManage} />
      ) : (
        <DocumentRows documents={visible} canManage={canManage} />
      )}
    </div>
  );
}

function Shelf({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium">{title}</h3>
        <p className="text-[13px] text-white/35">{count}</p>
      </div>
      {children}
    </section>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-[#1a1a1a] font-medium text-white"
          : "text-white/40 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}

function Kpi({
  label,
  value,
  hint,
  href,
  active,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl bg-[#111] p-5 transition-colors hover:bg-[#161616]",
        active && "ring-1 ring-white/15",
      )}
    >
      <p className="text-[13px] text-white/45">{label}</p>
      <p className="mt-4 font-[family-name:var(--font-display)] text-[34px] leading-none tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-[13px] text-white/40">{hint}</p>
    </Link>
  );
}
