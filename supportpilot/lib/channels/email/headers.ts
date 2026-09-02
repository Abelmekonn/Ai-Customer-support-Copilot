import { stripReplyPrefix } from "@/lib/channels/email/parse";

export function wrapMessageId(id: string) {
  const trimmed = id.replace(/^<|>$/g, "").trim();
  return `<${trimmed}>`;
}

export function unwrapMessageId(id: string) {
  return id.replace(/^<|>$/g, "").trim();
}

export function replySubject(subject: string) {
  const stripped = stripReplyPrefix(subject);
  return `Re: ${stripped}`;
}

export function newOutboundMessageId(domain: string) {
  const host = domain.replace(/^@/, "").trim() || "mail.supportpilot.local";
  return `${crypto.randomUUID()}@${host}`;
}

export function buildThreadHeaders(input: {
  ourMessageId: string;
  previousIds: string[];
}) {
  const previous = [...new Set(input.previousIds.map(unwrapMessageId).filter(Boolean))];
  const inReplyTo = previous.at(-1) ?? null;
  const messageId = unwrapMessageId(input.ourMessageId);

  return {
    messageId,
    inReplyTo,
    references: previous,
    headerMessageId: wrapMessageId(messageId),
    headerInReplyTo: inReplyTo ? wrapMessageId(inReplyTo) : null,
    headerReferences: previous.map(wrapMessageId).join(" "),
  };
}
