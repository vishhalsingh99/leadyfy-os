import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getPayment } from "@/lib/services/payment-service";
import { listOrders } from "@/lib/services/order-service";
import { canManageFinancials } from "@/lib/permissions";
import { PaymentForm } from "../../payment-form";
import { updatePaymentAction } from "../../actions";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect(`/payments/${id}`);

  const payment = await getPayment(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!payment) notFound();

  const orders = await listOrders(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {payment.invoiceNumber}</h1>
      <PaymentForm
        action={updatePaymentAction.bind(null, id)}
        orders={orders}
        submitLabel="Save changes"
        defaultValues={{
          orderId: payment.orderId,
          invoiceNumber: payment.invoiceNumber,
          amount: Number(payment.amount),
          amountPaid: Number(payment.amountPaid),
          status: payment.status,
          method: payment.method ?? "",
          transactionRef: payment.transactionRef ?? "",
          dueDate: toDateInputValue(payment.dueDate),
          paidAt: toDateInputValue(payment.paidAt),
          notes: payment.notes ?? "",
        }}
      />
    </div>
  );
}
