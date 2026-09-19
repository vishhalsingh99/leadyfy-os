import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getOrder } from "@/lib/services/order-service";
import { listClients } from "@/lib/services/client-service";
import { canManageOrders } from "@/lib/permissions";
import { OrderForm } from "../../order-form";
import { updateOrderAction } from "../../actions";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageOrders(actor)) redirect(`/orders/${id}`);

  const order = await getOrder(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!order) notFound();

  const clients = await listClients(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {order.packageName}</h1>
      <OrderForm
        action={updateOrderAction.bind(null, id)}
        clients={clients}
        submitLabel="Save changes"
        defaultValues={{
          clientId: order.clientId,
          packageName: order.packageName,
          videoCount: order.videoCount,
          totalValue: Number(order.totalValue),
          status: order.status,
          startDate: toDateInputValue(order.startDate),
          dueDate: toDateInputValue(order.dueDate),
        }}
      />
    </div>
  );
}
