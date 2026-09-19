import { z } from "zod";

export const orderStatusValues = [
  "NEW",
  "ONBOARDING",
  "IN_PRODUCTION",
  "PARTIALLY_DELIVERED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export const createOrderSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  packageName: z.string().trim().min(1, "Package name is required"),
  videoCount: z.number().int().positive("Must be at least 1"),
  totalValue: z.number().nonnegative("Must be 0 or more"),
  status: z.enum(orderStatusValues),
  startDate: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export const updateOrderSchema = createOrderSchema.partial();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
