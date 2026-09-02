import { MiniMaxError, generateCopilotDraftFromThread } from "@/lib/ai/minimax";
import type { CopilotResult, CopilotSource } from "@/lib/ai/types";
import { calculateConfidence } from "@/lib/copilot/confidence";
import { retrievePolicyChunks } from "@/lib/rag/retrieve";
import { rewriteSearchQuery } from "@/lib/rag/rewrite";
import { NO_POLICY_RESPONSE, scoresFromRetrieval } from "@/lib/rag/scores";
import type { Message, TicketWithCustomer } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function draftTicketReply(input: {
  ticket: TicketWithCustomer;
  messages: Message[];
  supabase: SupabaseClient;
  organizationId: string;
}): Promise<
  CopilotResult & {
    intentConfidence: number;
    retrievalQuality: number;
    sourceCoverage: number;
    rewrittenQuery: string;
  }
> {
  const rewrittenQuery = rewriteSearchQuery({
    subject: input.ticket.subject,
    category: input.ticket.category,
    messages: input.messages,
  });

  const retrieved = rewrittenQuery
    ? await retrievePolicyChunks(input.supabase, input.organizationId, rewrittenQuery)
    : [];

  const { retrievalQuality, sourceCoverage } = scoresFromRetrieval(
    retrieved.map((chunk) => chunk.similarity),
  );

  const thread = input.messages
    .map((message) => `${message.sender_type.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const ticketContext = `Ticket ${input.ticket.ticket_number}
Subject: ${input.ticket.subject}
Customer: ${input.ticket.customer.name} <${input.ticket.customer.email}>
Priority: ${input.ticket.priority}
Category: ${input.ticket.category ?? "unknown"}

Thread:
${thread || "(no messages yet)"}`;

  const policyPassages = retrieved
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.documentName}${chunk.pageNumber ? ` p.${chunk.pageNumber}` : ""} (similarity ${chunk.similarity.toFixed(2)}):\n${chunk.content}`,
    )
    .join("\n\n");

  const { data: organization } = await input.supabase
    .from("organizations")
    .select("brand_tone")
    .eq("id", input.organizationId)
    .maybeSingle();

  const draft = await generateCopilotDraftFromThread({
    ticketContext,
    policyPassages,
    brandTone: organization?.brand_tone,
  });

  const sources: CopilotSource[] = retrieved.map((chunk) => ({
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    pageNumber: chunk.pageNumber,
    similarity: chunk.similarity,
  }));

  const response =
    retrieved.length === 0 ? NO_POLICY_RESPONSE : draft.response;

  const confidence = calculateConfidence({
    retrievalQuality,
    sourceCoverage,
    intentConfidence: draft.intentConfidence,
  });

  return {
    intent: draft.intent,
    category: draft.category,
    urgency: draft.urgency,
    confidence: confidence.overall,
    response,
    sources,
    needsHumanReview: true,
    intentConfidence: draft.intentConfidence,
    retrievalQuality,
    sourceCoverage,
    rewrittenQuery,
  };
}

export function toCopilotError(error: unknown) {
  if (error instanceof MiniMaxError) return error.message;
  if (error instanceof Error) return error.message;
  return "Could not generate a draft.";
}
