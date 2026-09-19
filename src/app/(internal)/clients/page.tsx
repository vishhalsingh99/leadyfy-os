import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listClients } from "@/lib/services/client-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { canManageClients } from "@/lib/permissions";

export default async function ClientsPage() {
  const actor = await getActorOrRedirect();
  const clients = await listClients(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageClients(actor) ? (
          <Button render={<Link href="/clients/new">New client</Link>} />
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">
                  {client.companyName}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{client.contactName}</span>
                  <span className="text-sm text-muted-foreground">{client.contactEmail}</span>
                </div>
              </TableCell>
              <TableCell>{client.industry ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge status={client.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.createdAt.toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No clients in your scope yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
