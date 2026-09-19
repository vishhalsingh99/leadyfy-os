import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getCreator } from "@/lib/services/creator-service";
import { canManageCreators } from "@/lib/permissions";
import { CreatorForm } from "../../creator-form";
import { updateCreatorAction } from "../../actions";

export default async function EditCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageCreators(actor)) redirect(`/creators/${id}`);

  const creator = await getCreator(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!creator) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {creator.name}</h1>
      <CreatorForm
        action={updateCreatorAction.bind(null, id)}
        submitLabel="Save changes"
        defaultValues={{
          name: creator.name,
          email: creator.email,
          phone: creator.phone ?? "",
          city: creator.city ?? "",
          languages: creator.languages ?? "",
          niches: creator.niches ?? "",
          ratePerVideo: Number(creator.ratePerVideo),
        }}
      />
    </div>
  );
}
