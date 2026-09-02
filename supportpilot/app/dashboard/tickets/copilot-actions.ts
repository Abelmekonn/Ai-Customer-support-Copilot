"use server";

import { requireUser } from "@/lib/auth";
import { assertCanGenerateDraft } from "@/lib/billing/usage";
import { toCopilotError, draftTicketReply } from "@/lib/copilot/generate";
import { getTicket, listMessages } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { recordUsage } from "@/lib/usage/record";
import { revalidatePath } from "next/cache";

export type CopilotActionState = {
  error?: string;
};

export async function generateCopilotDraftAction(
  _prev: CopilotActionState,
  formData: FormData,
): Promise<CopilotActionState> {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return { error: "Missing ticket." };

  const ticket = await getTicket(user.organization_id, ticketId);
  if (!ticket) return { error: "Ticket not found." };

  const cap = await assertCanGenerateDraft(user.organization_id);
  if (!cap.ok) {
    return { error: cap.error };
  }

  const messages = await listMessages(ticket.id);

  try {
    const supabase = await createClient();
    const result = await draftTicketReply({
      ticket,
      messages,
      supabase,
      organizationId: user.organization_id,
    });
    const { data: generation, error } = await supabase
      .from("ai_generations")
      .insert({
        ticket_id: ticket.id,
        organization_id: user.organization_id,
        intent: result.intent,
        category: result.category,
        urgency: result.urgency,
        confidence: result.confidence,
        retrieval_quality: result.retrievalQuality,
        source_coverage: result.sourceCoverage,
        intent_confidence: result.intentConfidence,
        rewritten_query: result.rewrittenQuery,
        response: result.response,
        needs_human_review: true,
        model: process.env.MINIMAX_MODEL?.trim() || "MiniMax-M3",
      })
      .select("id")
      .single();

    if (error || !generation) return { error: error?.message ?? "Could not save the draft." };

    if (result.sources.length > 0) {
      const { error: citationError } = await supabase.from("citations").insert(
        result.sources.map((source) => ({
          generation_id: generation.id,
          chunk_id: source.chunkId,
          similarity: source.similarity,
        })),
      );
      if (citationError) return { error: citationError.message };
    }

    await recordUsage({
      organizationId: user.organization_id,
      type: "draft",
      metadata: { ticketId: ticket.id, generationId: generation.id, sources: result.sources.length },
    });

    await supabase
      .from("tickets")
      .update({
        category: result.category,
        priority: result.urgency,
      })
      .eq("id", ticket.id)
      .eq("organization_id", user.organization_id);

    revalidatePath(`/dashboard/tickets/${ticket.id}`);
    revalidatePath("/dashboard/tickets");
    return {};
  } catch (error) {
    return { error: toCopilotError(error) };
  }
}
