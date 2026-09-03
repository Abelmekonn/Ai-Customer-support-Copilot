"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { libraryHref, type LibraryQuery } from "@/lib/knowledge/library";

export function KnowledgeSearch({ query }: { query: LibraryQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSearch(value: string) {
    startTransition(() => {
      router.replace(libraryHref({ ...query, q: value }));
    });
  }

  return (
    <form
      action="/dashboard/knowledge"
      method="get"
      className="flex justify-center"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSearch(String(data.get("q") ?? ""));
      }}
    >
      <label className={`relative w-full max-w-[420px] ${pending ? "opacity-70" : ""}`}>
        <span className="sr-only">Search the knowledge library</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder="Search policy files..."
          onChange={(event) => onSearch(event.target.value)}
          className="h-10 w-full rounded-full border border-white/[0.08] bg-[#141414] pr-4 pl-10 text-[13px] text-white outline-none placeholder:text-white/30 focus-visible:border-white/20"
        />
      </label>
    </form>
  );
}
