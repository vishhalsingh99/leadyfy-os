import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageFinancials } from "@/lib/permissions";
import { listOrders } from "@/lib/services/order-service";
import { PaymentForm } from "../payment-form";
import { createPaymentAction } from "../actions";

export default async function NewPaymentPage() {
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/payments");

  const orders = await listOrders(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New payment</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet — create an order first.</p>
      ) : (
        <PaymentForm action={createPaymentAction} orders={orders} submitLabel="Record payment" />
      )}
    </div>
  );
}
