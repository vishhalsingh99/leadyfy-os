import { z } from "zod";

export const creatorPayoutStatusValues = ["PENDING", "APPROVED", "PAID"] as const;

export const createCreatorPayoutSchema = z.object({
  creatorId: z.string().min(1, "Creator is required"),
  shootId: z.string().trim().optional().or(z.literal("")),
  videoCount: z.number().int().positive(),
  amount: z.number().nonnegative(),
  status: z.enum(creatorPayoutStatusValues),
  paidAt: z.string().trim().optional().or(z.literal("")),
  reference: z.string().trim().optional().or(z.literal("")),
});

export const updateCreatorPayoutSchema = createCreatorPayoutSchema.partial();

export type CreateCreatorPayoutInput = z.infer<typeof createCreatorPayoutSchema>;
export type UpdateCreatorPayoutInput = z.infer<typeof updateCreatorPayoutSchema>;
