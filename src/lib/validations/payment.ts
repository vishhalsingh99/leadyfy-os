import { z } from "zod";

export const paymentStatusValues = ["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"] as const;

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  amount: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
  status: z.enum(paymentStatusValues),
  method: z.string().trim().optional().or(z.literal("")),
  transactionRef: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
  paidAt: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
