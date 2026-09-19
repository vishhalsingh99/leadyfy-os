import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listPortalScripts } from "@/lib/services/portal/script-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default async function PortalScriptsPage() {
  const actor = await getActorOrRedirect();
  const scripts = await listPortalScripts(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Scripts</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Video #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scripts.map((script) => (
            <TableRow key={script.id}>
              <TableCell>{script.videoNumber}</TableCell>
              <TableCell>
                <Link href={`/portal/scripts/${script.id}`} className="font-medium text-primary hover:underline">
                  {script.title}
                </Link>
              </TableCell>
              <TableCell>{script.language}</TableCell>
              <TableCell>
                <StatusBadge status={script.status} />
              </TableCell>
            </TableRow>
          ))}
          {scripts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No scripts yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
