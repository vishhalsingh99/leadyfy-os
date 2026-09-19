import { getActorOrRedirect } from "@/lib/rbac";
import { listPortalTickets } from "@/lib/services/portal/support-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { TicketForm } from "./ticket-form";

export default async function PortalSupportPage() {
  const actor = await getActorOrRedirect();
  const tickets = await listPortalTickets(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Support</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{ticket.subject}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{ticket.message}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {ticket.createdAt.toLocaleString()}
            </div>
          </div>
        ))}
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No support tickets yet.</p>
        ) : null}
      </div>
    </div>
  );
}
