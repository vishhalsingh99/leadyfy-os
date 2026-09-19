import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getClient } from "@/lib/services/client-service";
import { canManageClients } from "@/lib/permissions";
import { ClientForm } from "../../client-form";
import { updateClientAction } from "../../actions";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageClients(actor)) redirect(`/clients/${id}`);

  const client = await getClient(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {client.companyName}</h1>
      <ClientForm
        action={updateClientAction.bind(null, id)}
        submitLabel="Save changes"
        defaultValues={{
          companyName: client.companyName,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone ?? "",
          industry: client.industry ?? "",
          status: client.status,
        }}
      />
    </div>
  );
}
