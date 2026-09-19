import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getOrder, getProductionCounter } from "@/lib/services/order-service";
import { listScriptsForOrder } from "@/lib/services/script-service";
import { canManageOrders } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const order = await getOrder(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!order) notFound();

  const counter = await getProductionCounter(actor, id);
  const scripts = await listScriptsForOrder(actor, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{order.packageName}</h1>
          <StatusBadge status={order.status} />
        </div>
        {canManageOrders(actor) ? (
          <Button variant="outline" render={<Link href={`/orders/${order.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Link href={`/clients/${order.clientId}`} className="text-primary hover:underline">
              {order.client.companyName}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commercials</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Contracted videos: {order.videoCount}</div>
            <div>Total value: {formatCurrency(order.totalValue)}</div>
            <div className="text-muted-foreground">
              {order.startDate ? `Starts ${order.startDate.toLocaleDateString()}` : "No start date"}
              {order.dueDate ? ` · Due ${order.dueDate.toLocaleDateString()}` : ""}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live production counter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <CounterStat label="Ordered" value={counter.ordered} />
            <CounterStat label="Assigned" value={counter.assigned} />
            <CounterStat label="Completed" value={counter.completed} />
            <CounterStat label="Delivered" value={counter.delivered} />
            <CounterStat label="Remaining" value={counter.remaining} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scripts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {scripts.length === 0 ? (
            <span className="text-muted-foreground">No scripts yet.</span>
          ) : (
            scripts.map((script) => (
              <Link
                key={script.id}
                href={`/scripts/${script.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
              >
                <span>
                  #{script.videoNumber} — {script.title}
                </span>
                <StatusBadge status={script.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CounterStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}
