import { z } from "zod";

export const copilotClassificationSchema = z.object({
  intent: z.string().min(1),
  category: z.string().min(1),
  urgency: z.enum(["low", "medium", "high"]),
  intentConfidence: z.number().min(0).max(1),
});

export const copilotResultSchema = z.object({
  intent: z.string().min(1),
  category: z.string().min(1),
  urgency: z.enum(["low", "medium", "high"]),
  response: z.string().min(1),
  needsHumanReview: z.boolean(),
});

export const copilotSourceSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentName: z.string().min(1),
  pageNumber: z.number().int().positive().optional(),
  similarity: z.number().min(0).max(1),
});
