import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listShoots } from "@/lib/services/shoot-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { canManageShoots } from "@/lib/permissions";

export default async function ShootsPage() {
  const actor = await getActorOrRedirect();
  const shoots = await listShoots(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shoots</h1>
          <p className="text-sm text-muted-foreground">
            {shoots.length} shoot{shoots.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageShoots(actor) ? (
          <Button render={<Link href="/shoots/new">New shoot</Link>} />
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Script</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Date/time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shoots.map((shoot) => (
            <TableRow key={shoot.id}>
              <TableCell>
                <Link href={`/shoots/${shoot.id}`} className="font-medium text-primary hover:underline">
                  {shoot.script.order.client.companyName} — {shoot.script.title}
                </Link>
              </TableCell>
              <TableCell>{shoot.creator.name}</TableCell>
              <TableCell>{shoot.scheduledAt.toLocaleString()}</TableCell>
              <TableCell>{shoot.location ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge status={shoot.status} />
              </TableCell>
            </TableRow>
          ))}
          {shoots.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No shoots in your scope yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
