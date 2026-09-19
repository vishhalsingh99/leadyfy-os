"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createExpense, updateExpense } from "@/lib/services/expense-service";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validations/expense";

export type ExpenseFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function formEntriesWithNumbers(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return { ...raw, ...(raw.amount !== undefined && { amount: Number(raw.amount) }) };
}

export async function createExpenseAction(
  _prev: ExpenseFormResult,
  formData: FormData,
): Promise<ExpenseFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createExpenseSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createExpense(actor, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function updateExpenseAction(
  id: string,
  _prev: ExpenseFormResult,
  formData: FormData,
): Promise<ExpenseFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateExpenseSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateExpense(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}
