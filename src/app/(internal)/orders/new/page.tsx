import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageOrders } from "@/lib/permissions";
import { listClients } from "@/lib/services/client-service";
import { OrderForm } from "../order-form";
import { createOrderAction } from "../actions";

export default async function NewOrderPage() {
  const actor = await getActorOrRedirect();
  if (!canManageOrders(actor)) redirect("/orders");

  const clients = await listClients(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New order</h1>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clients in your scope yet — create a client first.
        </p>
      ) : (
        <OrderForm action={createOrderAction} clients={clients} submitLabel="Create order" />
      )}
    </div>
  );
}
