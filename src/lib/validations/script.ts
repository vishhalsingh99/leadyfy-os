import { z } from "zod";

export const scriptStatusValues = [
  "DRAFT",
  "ASSIGNED",
  "IN_REVIEW",
  "SENT_TO_CLIENT",
  "REVISION_REQUIRED",
  "APPROVED",
  "READY_FOR_SHOOT",
] as const;

export const createScriptSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  assignedToId: z.string().trim().optional().or(z.literal("")),
  videoNumber: z.number().int().positive(),
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Script content is required"),
  language: z.string().trim().min(1, "Language is required"),
  status: z.enum(scriptStatusValues),
  deadline: z.string().trim().optional().or(z.literal("")),
});

export const updateScriptSchema = createScriptSchema.partial();

export type CreateScriptInput = z.infer<typeof createScriptSchema>;
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;
