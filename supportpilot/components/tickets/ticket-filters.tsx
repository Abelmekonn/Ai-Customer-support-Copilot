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
    <aside className="w-52 shrink-0 border-r border-hairline-soft bg-canvas p-4">
      <p className="typo-eyebrow mb-4 px-1 text-steel">Queue</p>
      <div className="flex flex-col gap-2">
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
                "flex items-center justify-between rounded-full border px-4 py-2 text-[14px] font-medium",
                isActive
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-transparent text-white/60",
              )}
            >
              {LABELS[status]}
              <span className="font-mono text-[12px]">{counts[status] ?? 0}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
