import { Badge } from "@/components/ui/badge";
import { RetrySendButton } from "@/components/tickets/retry-send-button";
import type { Message, MessageAttachment } from "@/lib/types";
import { cn, formatRelativeTime, initials } from "@/lib/utils";

const SENDER_LABEL = {
  customer: "Customer",
  agent: "Agent",
  ai: "Copilot",
} as const;

export function TicketMessage({
  message,
  customerName,
  agentName,
  attachments = [],
}: {
  message: Message;
  customerName?: string;
  agentName?: string;
  attachments?: (MessageAttachment & { url: string | null })[];
}) {
  const isCustomer = message.sender_type === "customer";
  const isInternal = Boolean(message.is_internal);
  const label =
    message.sender_type === "customer"
      ? customerName ?? SENDER_LABEL.customer
      : message.sender_type === "agent"
        ? agentName ?? SENDER_LABEL.agent
        : SENDER_LABEL.ai;

  return (
    <article className={cn("mb-4 w-full max-w-3xl", isCustomer ? "mr-auto" : "ml-auto")}>
      <div className="mb-1 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-cream text-[10px] font-semibold">
          {initials(label)}
        </span>
        <span className="text-[13px] font-medium">{label}</span>
        {message.sender_type === "ai" ? <Badge variant="default">AI</Badge> : null}
        {isInternal ? <Badge variant="medium">Internal</Badge> : null}
        {message.send_status === "queued" ? (
          <span className="text-[12px] text-steel">Sending…</span>
        ) : null}
        {message.send_status === "sent" ? (
          <span className="text-[12px] text-steel">Sent</span>
        ) : null}
        {message.send_status === "failed" ? (
          <span className="text-[12px] text-destructive">Not sent</span>
        ) : null}
        <span className="text-[13px] text-steel">
          {formatRelativeTime(message.created_at)}
        </span>
      </div>
      <div
        className={cn(
          "rounded-lg px-3.5 py-2.5 text-[16px] leading-[1.55]",
          isCustomer ? "bg-[#141414]" : isInternal ? "border border-dashed border-white/20 bg-black" : "border border-white/10 bg-black",
        )}
      >
        {message.content}
      </div>
      {message.send_status === "failed" ? (
        <div className="mt-2">
          <p className="text-[13px] text-destructive">
            {message.send_error ?? "The reply could not be sent. Retry when you’re ready."}
          </p>
          <RetrySendButton ticketId={message.ticket_id} messageId={message.id} />
        </div>
      ) : null}
      {attachments.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              {attachment.url ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-primary underline-offset-2 hover:underline"
                >
                  {attachment.file_name}
                </a>
              ) : (
                <span className="text-[13px] text-steel">{attachment.file_name}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
