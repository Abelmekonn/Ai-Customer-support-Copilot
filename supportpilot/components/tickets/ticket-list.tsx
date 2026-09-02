"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { TicketPriority, TicketWithCustomer } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PRIORITY_VARIANT: Record<TicketPriority, "high" | "medium" | "low"> = {
  high: "high",
  medium: "medium",
  low: "low",
};

export function TicketList({ tickets }: { tickets: TicketWithCustomer[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const query = searchParams.get("q") ?? "";

  function onSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-hairline-soft bg-canvas px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-steel" />
          <Input
            defaultValue={query}
            placeholder="Search tickets"
            className="pl-8"
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
      </div>
      <ul className={`flex-1 overflow-auto ${pending ? "opacity-70" : ""}`}>
        {tickets.length === 0 ? (
          <li className="px-5 py-10 text-[14px] text-steel">
            Nothing in this queue.
          </li>
        ) : (
          tickets.map((ticket) => (
            <li key={ticket.id} className="border-b border-hairline-soft">
              <Link
                href={`/dashboard/tickets/${ticket.id}`}
                className="block px-5 py-4 hover:bg-cream-light"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{ticket.subject}</p>
                  <span className="shrink-0 text-[13px] text-steel">
                    {formatRelativeTime(ticket.last_message_at ?? ticket.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-steel">
                  {ticket.customer.name}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {ticket.category}
                  </span>
                  <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
