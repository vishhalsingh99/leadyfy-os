import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageScripts } from "@/lib/permissions";
import { listOrders } from "@/lib/services/order-service";
import { listScriptWriterOptions } from "@/lib/services/script-service";
import { ScriptForm } from "../script-form";
import { createScriptAction } from "../actions";

export default async function NewScriptPage() {
  const actor = await getActorOrRedirect();
  if (!canManageScripts(actor)) redirect("/scripts");

  const [orders, writers] = await Promise.all([listOrders(actor), listScriptWriterOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New script</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders in your scope yet — create an order first.</p>
      ) : (
        <ScriptForm action={createScriptAction} orders={orders} writers={writers} submitLabel="Create script" />
      )}
    </div>
  );
}
