"use client";

import { sendTicketMessage } from "@/app/dashboard/tickets/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Sending…" : "Send reply"}
    </Button>
  );
}

export function TicketReplyForm({
  ticketId,
  disabled,
}: {
  ticketId: string;
  disabled: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await sendTicketMessage(formData);
        formRef.current?.reset();
      }}
      className="border-t border-border p-4"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <Textarea
        name="content"
        placeholder={
          disabled
            ? "This ticket is resolved."
            : "Write a reply. The AI never sends this for you."
        }
        disabled={disabled}
        required
      />
      <div className="mt-3 flex justify-end">
        <SubmitButton disabled={disabled} />
      </div>
    </form>
  );
}
