"use client";

import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const QUEUES: { status: TicketStatus; label: string; hint: string }[] = [
  { status: "open", label: "Open", hint: "Need a reply" },
  { status: "pending", label: "Pending", hint: "Waiting on them" },
  { status: "resolved", label: "Resolved", hint: "Closed" },
];

export function TicketFilters({
  counts,
}: {
  counts: Record<TicketStatus, number>;
}) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("status") ?? "open") as TicketStatus;
  const query = searchParams.get("q");

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0a] px-3 py-5">
      <p className="px-3 pb-2 text-[11px] font-medium tracking-[0.06em] text-white/30">Queue</p>
      <div className="flex flex-col gap-0.5">
        {QUEUES.map((queue) => {
          const params = new URLSearchParams();
          params.set("status", queue.status);
          if (query) params.set("q", query);
          const isActive = active === queue.status;
          return (
            <Link
              key={queue.status}
              href={`/dashboard/tickets?${params.toString()}`}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors duration-150",
                isActive
                  ? "bg-[#1a1a1a] text-white"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <span>
                <span className="block text-[13px] font-medium">{queue.label}</span>
                <span className="mt-0.5 block text-[11px] text-white/30">{queue.hint}</span>
              </span>
              <span
                className={cn(
                  "tabular-nums text-[13px]",
                  isActive ? "text-white" : "text-white/35",
                )}
              >
                {counts[queue.status] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
