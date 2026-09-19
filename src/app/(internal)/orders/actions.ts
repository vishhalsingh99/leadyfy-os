"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createOrder, updateOrder } from "@/lib/services/order-service";
import { createOrderSchema, updateOrderSchema } from "@/lib/validations/order";

export type OrderFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

// FormData values are always strings; the shared zod schema expects real
// numbers for videoCount/totalValue (so client-side react-hook-form
// validation — fed real numbers via valueAsNumber — matches it exactly).
// This is the one adapter spot for that string/number boundary.
function formEntriesWithNumbers(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    ...(raw.videoCount !== undefined && { videoCount: Number(raw.videoCount) }),
    ...(raw.totalValue !== undefined && { totalValue: Number(raw.totalValue) }),
  };
}

export async function createOrderAction(
  _prev: OrderFormResult,
  formData: FormData,
): Promise<OrderFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createOrderSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let orderId: string;
  try {
    const order = await createOrder(actor, parsed.data);
    orderId = order.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/orders");
  redirect(`/orders/${orderId}`);
}

export async function updateOrderAction(
  id: string,
  _prev: OrderFormResult,
  formData: FormData,
): Promise<OrderFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateOrderSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateOrder(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}
