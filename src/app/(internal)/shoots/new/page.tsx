import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageShoots } from "@/lib/permissions";
import { listScripts } from "@/lib/services/script-service";
import { listCreators } from "@/lib/services/creator-service";
import { ShootForm } from "../shoot-form";
import { createShootAction } from "../actions";

export default async function NewShootPage() {
  const actor = await getActorOrRedirect();
  if (!canManageShoots(actor)) redirect("/shoots");

  const [scripts, creators] = await Promise.all([listScripts(actor), listCreators(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New shoot</h1>
      {scripts.length === 0 || creators.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Need at least one script and one creator before scheduling a shoot.
        </p>
      ) : (
        <ShootForm action={createShootAction} scripts={scripts} creators={creators} submitLabel="Schedule shoot" />
      )}
    </div>
  );
}
