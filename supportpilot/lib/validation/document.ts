import { z } from "zod";

export const documentFileTypeSchema = z.enum(["pdf", "txt", "md"]);

export const createDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  fileType: documentFileTypeSchema,
});
