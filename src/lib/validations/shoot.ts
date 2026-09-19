import { z } from "zod";

export const shootStatusValues = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESHOOT_REQUIRED",
] as const;

export const createShootSchema = z.object({
  scriptId: z.string().min(1, "Script is required"),
  creatorId: z.string().min(1, "Creator is required"),
  scheduledAt: z.string().trim().min(1, "Date/time is required"),
  location: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(shootStatusValues),
});

export const updateShootSchema = createShootSchema.partial();

export type CreateShootInput = z.infer<typeof createShootSchema>;
export type UpdateShootInput = z.infer<typeof updateShootSchema>;
