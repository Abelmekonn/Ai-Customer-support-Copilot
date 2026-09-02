import { z } from "zod";

export const analyzeTicketSchema = z.object({
  ticketId: z.string().uuid(),
});

export const draftReplySchema = z.object({
  ticketId: z.string().uuid(),
});
