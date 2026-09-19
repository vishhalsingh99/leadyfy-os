import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getPortalOrder } from "@/lib/services/portal/order-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const order = await getPortalOrder(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{order.packageName}</h1>
        <StatusBadge status={order.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Stat label="Contracted" value={order.videoCount} />
          <Stat label="In production" value={order.videosAssigned} />
          <Stat label="Delivered" value={order.videosDelivered} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {order.startDate ? `Started ${order.startDate.toLocaleDateString()}` : "Start date not set"}
          {order.dueDate ? ` · Due ${order.dueDate.toLocaleDateString()}` : ""}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}
