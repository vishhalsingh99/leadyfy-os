import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageFinancials } from "@/lib/permissions";
import { listCreators } from "@/lib/services/creator-service";
import { listShoots } from "@/lib/services/shoot-service";
import { CreatorPayoutForm } from "../creator-payout-form";
import { createCreatorPayoutAction } from "../actions";

export default async function NewCreatorPayoutPage() {
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/creator-payouts");

  const [creators, shoots] = await Promise.all([listCreators(actor), listShoots(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New creator payout</h1>
      {creators.length === 0 ? (
        <p className="text-sm text-muted-foreground">No creators yet — add a creator first.</p>
      ) : (
        <CreatorPayoutForm action={createCreatorPayoutAction} creators={creators} shoots={shoots} submitLabel="Record payout" />
      )}
    </div>
  );
}
