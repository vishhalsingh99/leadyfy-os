import { getActorOrRedirect } from "@/lib/rbac";
import { listSupportTickets } from "@/lib/services/support-ticket-service";
import { canResolveSupportTickets } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { TicketStatusSelect } from "./ticket-status-select";

export default async function SupportTicketsPage() {
  const actor = await getActorOrRedirect();
  const tickets = await listSupportTickets(actor);
  const canResolve = canResolveSupportTickets(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.client.companyName}</TableCell>
              <TableCell>{ticket.subject}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{ticket.message}</TableCell>
              <TableCell>
                {canResolve ? (
                  <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
                ) : (
                  <StatusBadge status={ticket.status} />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{ticket.createdAt.toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No support tickets yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
