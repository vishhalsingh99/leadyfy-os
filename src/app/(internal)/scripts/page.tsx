import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listScripts } from "@/lib/services/script-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { canManageScripts } from "@/lib/permissions";

export default async function ScriptsPage() {
  const actor = await getActorOrRedirect();
  const scripts = await listScripts(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scripts</h1>
          <p className="text-sm text-muted-foreground">
            {scripts.length} script{scripts.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageScripts(actor) ? (
          <Button render={<Link href="/scripts/new">New script</Link>} />
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client / Order</TableHead>
            <TableHead>Video #</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scripts.map((script) => (
            <TableRow key={script.id}>
              <TableCell>
                <Link href={`/scripts/${script.id}`} className="font-medium text-primary hover:underline">
                  {script.title}
                </Link>
              </TableCell>
              <TableCell>
                {script.order.client.companyName} — {script.order.packageName}
              </TableCell>
              <TableCell>{script.videoNumber}</TableCell>
              <TableCell>{script.language}</TableCell>
              <TableCell>
                <StatusBadge status={script.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {script.deadline ? script.deadline.toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
          {scripts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No scripts in your scope yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
