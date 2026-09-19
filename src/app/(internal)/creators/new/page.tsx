import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageCreators } from "@/lib/permissions";
import { CreatorForm } from "../creator-form";
import { createCreatorAction } from "../actions";

export default async function NewCreatorPage() {
  const actor = await getActorOrRedirect();
  if (!canManageCreators(actor)) redirect("/creators");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New creator</h1>
      <CreatorForm action={createCreatorAction} submitLabel="Create creator" />
    </div>
  );
}
