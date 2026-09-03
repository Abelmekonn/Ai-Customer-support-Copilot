"use client";

import { Search } from "lucide-react";

export function CustomerSearch({
  query,
  filter,
}: {
  query: string;
  filter: "all" | "open" | "pending";
}) {
  return (
    <form action="/dashboard/customers" method="get" className="flex justify-center">
      {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
      <label className="relative w-full max-w-[420px]">
        <span className="sr-only">Search customers</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search name, email, or last ticket..."
          className="h-10 w-full rounded-full border border-white/[0.08] bg-[#141414] pr-4 pl-10 text-[13px] text-white outline-none placeholder:text-white/30 focus-visible:border-white/20"
        />
      </label>
    </form>
  );
}
