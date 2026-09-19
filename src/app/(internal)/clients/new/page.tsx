import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageClients } from "@/lib/permissions";
import { ClientForm } from "../client-form";
import { createClientAction } from "../actions";

export default async function NewClientPage() {
  const actor = await getActorOrRedirect();
  if (!canManageClients(actor)) redirect("/clients");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New client</h1>
      <ClientForm action={createClientAction} submitLabel="Create client" />
    </div>
  );
}
