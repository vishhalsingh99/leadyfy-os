import { z } from "zod";

export const expenseCategoryValues = [
  "Salaries",
  "Office",
  "Studio",
  "Equipment",
  "Fuel",
  "Payouts",
  "Other",
] as const;

export const createExpenseSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().optional().or(z.literal("")),
  amount: z.number().nonnegative(),
  incurredAt: z.string().trim().min(1, "Date is required"),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
