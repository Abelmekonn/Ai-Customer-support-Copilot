import type { Message } from "@/lib/types";

const MAX_QUERY_CHARS = 480;

export function rewriteSearchQuery(input: {
  subject: string;
  category?: string | null;
  messages: Pick<Message, "sender_type" | "content">[];
}) {
  const lastCustomer = [...input.messages]
    .reverse()
    .find((message) => message.sender_type === "customer");

  const parts = [input.subject, input.category, lastCustomer?.content]
    .filter((part): part is string => Boolean(part && part.trim()));

  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_CHARS);
}
