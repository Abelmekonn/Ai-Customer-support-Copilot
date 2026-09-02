"use client";

import { assignTicketAction } from "@/app/dashboard/actions";
import type { AppUser } from "@/lib/types";

export function AssigneeSelect({
  ticketId,
  assignedTo,
  teammates,
}: {
  ticketId: string;
  assignedTo: string | null;
  teammates: Pick<AppUser, "id" | "full_name">[];
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-steel">
      <span>Assignee</span>
      <select
        defaultValue={assignedTo ?? ""}
        className="h-9 rounded-md border border-white/15 bg-black px-2 text-[13px] text-white"
        onChange={(event) => {
          void assignTicketAction(ticketId, event.target.value);
        }}
      >
        <option value="">Unassigned</option>
        {teammates.map((teammate) => (
          <option key={teammate.id} value={teammate.id}>
            {teammate.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}
