import Link from "next/link";
import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { listCreatorPayouts } from "@/lib/services/creator-payout-service";
import { canManageFinancials } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";

export default async function CreatorPayoutsPage() {
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/dashboard");
  const payouts = await listCreatorPayouts(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Creator Payouts</h1>
          <p className="text-sm text-muted-foreground">
            {payouts.length} payout{payouts.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/creator-payouts/new">New payout</Link>} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Creator</TableHead>
            <TableHead>Videos</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid on</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell className="font-medium">{payout.creator.name}</TableCell>
              <TableCell>{payout.videoCount}</TableCell>
              <TableCell>{formatCurrency(payout.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={payout.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {payout.paidAt ? payout.paidAt.toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                <Link href={`/creator-payouts/${payout.id}/edit`} className="text-primary hover:underline">
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {payouts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No payouts recorded yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
