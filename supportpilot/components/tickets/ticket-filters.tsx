"use client";

import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const LABELS: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
};

export function TicketFilters({
  counts,
}: {
  counts: Record<TicketStatus, number>;
}) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("status") ?? "open") as TicketStatus;
  const query = searchParams.get("q");

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-black p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/45">
        Queue
      </p>
      <div className="mt-4 flex flex-col gap-1.5">
        {(Object.keys(LABELS) as TicketStatus[]).map((status) => {
          const params = new URLSearchParams();
          params.set("status", status);
          if (query) params.set("q", query);
          const isActive = active === status;
          return (
            <Link
              key={status}
              href={`/dashboard/tickets?${params.toString()}`}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors",
                isActive
                  ? "bg-white text-black"
                  : "text-white/70 hover:bg-white/6 hover:text-white",
              )}
            >
              {LABELS[status]}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[12px]",
                  isActive ? "bg-black/10 text-black" : "bg-white/8 text-white/55",
                )}
              >
                {counts[status] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
