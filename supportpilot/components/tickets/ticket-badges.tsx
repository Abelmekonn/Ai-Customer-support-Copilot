import { Badge } from "@/components/ui/badge";
import type { TicketPriority, TicketStatus } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={priority} className="capitalize">{priority}</Badge>;
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={status} className="capitalize">{status}</Badge>;
}
