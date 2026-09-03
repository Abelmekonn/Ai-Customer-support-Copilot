"use client";

import { Search } from "lucide-react";

export function HomeSearch() {
  return (
    <form action="/dashboard/tickets" method="get" className="flex justify-center">
      <label className="relative w-full max-w-[420px]">
        <span className="sr-only">Search tickets</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          name="q"
          placeholder="Search tickets, customers..."
          className="h-10 w-full rounded-full border border-white/[0.08] bg-[#141414] pr-4 pl-10 text-[13px] text-white outline-none placeholder:text-white/30 focus-visible:border-white/20"
        />
      </label>
    </form>
  );
}
