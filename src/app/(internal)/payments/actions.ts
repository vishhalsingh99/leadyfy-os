"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createPayment, updatePayment } from "@/lib/services/payment-service";
import { createPaymentSchema, updatePaymentSchema } from "@/lib/validations/payment";

export type PaymentFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function formEntriesWithNumbers(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    ...(raw.amount !== undefined && { amount: Number(raw.amount) }),
    ...(raw.amountPaid !== undefined && { amountPaid: Number(raw.amountPaid) }),
  };
}

export async function createPaymentAction(
  _prev: PaymentFormResult,
  formData: FormData,
): Promise<PaymentFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createPaymentSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let paymentId: string;
  try {
    const payment = await createPayment(actor, parsed.data);
    paymentId = payment.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/payments");
  redirect(`/payments/${paymentId}`);
}

export async function updatePaymentAction(
  id: string,
  _prev: PaymentFormResult,
  formData: FormData,
): Promise<PaymentFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updatePaymentSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updatePayment(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${id}`);
  redirect(`/payments/${id}`);
}
