import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listPortalOrders } from "@/lib/services/portal/order-service";
import { listPortalScripts } from "@/lib/services/portal/script-service";
import { listPortalVideos } from "@/lib/services/portal/video-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export default async function PortalOverviewPage() {
  const actor = await getActorOrRedirect();
  const [orders, scripts, videos] = await Promise.all([
    listPortalOrders(actor),
    listPortalScripts(actor),
    listPortalVideos(actor),
  ]);

  const pendingScriptApprovals = scripts.filter((s) => s.status === "SENT_TO_CLIENT");
  const pendingVideoApprovals = videos.filter((v) => v.status === "CLIENT_REVIEW");
  const deliveredVideos = videos.filter((v) => v.status === "DELIVERED").length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Welcome, {actor.name}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{orders.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Videos delivered</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{deliveredVideos}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Awaiting your review</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {pendingScriptApprovals.length + pendingVideoApprovals.length}
          </CardContent>
        </Card>
      </div>

      {pendingScriptApprovals.length > 0 || pendingVideoApprovals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action required</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {pendingScriptApprovals.map((s) => (
              <Link
                key={s.id}
                href={`/portal/scripts/${s.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
              >
                <span>Script: {s.title}</span>
                <StatusBadge status={s.status} />
              </Link>
            ))}
            {pendingVideoApprovals.map((v) => (
              <Link
                key={v.id}
                href={`/portal/videos/${v.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
              >
                <span>Video: {v.title}</span>
                <StatusBadge status={v.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
