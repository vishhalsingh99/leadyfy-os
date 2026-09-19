import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getClient } from "@/lib/services/client-service";
import { listOrdersForClient } from "@/lib/services/order-service";
import { canManageClients } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const client = await getClient(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!client) notFound();

  const orders = await listOrdersForClient(actor, client.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{client.companyName}</h1>
          <StatusBadge status={client.status} />
        </div>
        {canManageClients(actor) ? (
          <Button variant="outline" render={<Link href={`/clients/${client.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>{client.contactName}</div>
            <div className="text-muted-foreground">{client.contactEmail}</div>
            <div className="text-muted-foreground">{client.contactPhone ?? "No phone on file"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Industry: {client.industry ?? "—"}</div>
            <div className="text-muted-foreground">
              Client since {client.createdAt.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/*
        Centralized hub (spec 4.1): scripts/shoots/videos/payments/tickets
        sections get added here as each of those services lands later in
        Phase 3/5 — same page, more cards composed in.
      */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {orders.length === 0 ? (
            <span className="text-muted-foreground">No orders yet.</span>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
              >
                <span>{order.packageName}</span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  {formatCurrency(order.totalValue)}
                  <StatusBadge status={order.status} />
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
