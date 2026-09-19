import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getShoot } from "@/lib/services/shoot-service";
import { listScripts } from "@/lib/services/script-service";
import { listCreators } from "@/lib/services/creator-service";
import { canManageShoots } from "@/lib/permissions";
import { ShootForm } from "../../shoot-form";
import { updateShootAction } from "../../actions";

function toDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditShootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageShoots(actor)) redirect(`/shoots/${id}`);

  const shoot = await getShoot(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!shoot) notFound();

  const [scripts, creators] = await Promise.all([listScripts(actor), listCreators(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {shoot.script.title}</h1>
      <ShootForm
        action={updateShootAction.bind(null, id)}
        scripts={scripts}
        creators={creators}
        submitLabel="Save changes"
        defaultValues={{
          scriptId: shoot.scriptId,
          creatorId: shoot.creatorId,
          scheduledAt: toDateTimeInputValue(shoot.scheduledAt),
          location: shoot.location ?? "",
          notes: shoot.notes ?? "",
          status: shoot.status,
        }}
      />
    </div>
  );
}
