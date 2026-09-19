import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listCreators } from "@/lib/services/creator-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageCreators, canViewCreatorRates } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils/format";

export default async function CreatorsPage() {
  const actor = await getActorOrRedirect();
  const creators = await listCreators(actor);
  const showRates = canViewCreatorRates(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Creators</h1>
          <p className="text-sm text-muted-foreground">
            {creators.length} creator{creators.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageCreators(actor) ? (
          <Button render={<Link href="/creators/new">New creator</Link>} />
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Languages</TableHead>
            <TableHead>Niches</TableHead>
            {showRates ? <TableHead>Rate / video</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {creators.map((creator) => (
            <TableRow key={creator.id}>
              <TableCell>
                <Link href={`/creators/${creator.id}`} className="font-medium text-primary hover:underline">
                  {creator.name}
                </Link>
              </TableCell>
              <TableCell>{creator.city ?? "—"}</TableCell>
              <TableCell>{creator.languages ?? "—"}</TableCell>
              <TableCell>{creator.niches ?? "—"}</TableCell>
              {showRates ? <TableCell>{formatCurrency(creator.ratePerVideo)}</TableCell> : null}
            </TableRow>
          ))}
          {creators.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showRates ? 5 : 4} className="text-center text-muted-foreground">
                No creators yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
