import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getCreatorPayout } from "@/lib/services/creator-payout-service";
import { listCreators } from "@/lib/services/creator-service";
import { listShoots } from "@/lib/services/shoot-service";
import { canManageFinancials } from "@/lib/permissions";
import { CreatorPayoutForm } from "../../creator-payout-form";
import { updateCreatorPayoutAction } from "../../actions";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditCreatorPayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/creator-payouts");

  const payout = await getCreatorPayout(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!payout) notFound();

  const [creators, shoots] = await Promise.all([listCreators(actor), listShoots(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit payout</h1>
      <CreatorPayoutForm
        action={updateCreatorPayoutAction.bind(null, id)}
        creators={creators}
        shoots={shoots}
        submitLabel="Save changes"
        defaultValues={{
          creatorId: payout.creatorId,
          shootId: payout.shootId ?? "",
          videoCount: payout.videoCount,
          amount: Number(payout.amount),
          status: payout.status,
          paidAt: toDateInputValue(payout.paidAt),
          reference: payout.reference ?? "",
        }}
      />
    </div>
  );
}
