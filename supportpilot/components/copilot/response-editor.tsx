"use client";

import { GenerateDraftButton } from "@/components/copilot/generate-draft-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function ResponseEditor({
  ticketId,
  initialValue = "",
}: {
  ticketId: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <p className="typo-eyebrow text-steel">Suggested response</p>
      <Textarea
        className="mt-2 min-h-40"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="A grounded draft will appear here."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="cream" disabled>
          Edit
        </Button>
        <GenerateDraftButton ticketId={ticketId} label="Regenerate" />
        <Button type="button" size="sm" disabled>
          Approve
        </Button>
      </div>
    </div>
  );
}
