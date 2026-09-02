import { z } from "zod";

export const ticketStatusSchema = z.enum(["open", "pending", "resolved"]);
export const ticketPrioritySchema = z.enum(["low", "medium", "high"]);

export const createTicketSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(3).max(200),
  priority: ticketPrioritySchema.default("medium"),
  category: z.string().min(1).max(80).optional(),
  message: z.string().min(1).max(8000),
});

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  category: z.string().min(1).max(80).nullable().optional(),
});

export const sendMessageSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(8000),
});
