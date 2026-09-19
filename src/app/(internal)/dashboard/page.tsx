import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { getDashboardKpis, getDashboardWidgets } from "@/lib/services/dashboard-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCurrency } from "@/lib/utils/format";

export default async function DashboardPage() {
  const actor = await getActorOrRedirect();
  const [kpis, widgets] = await Promise.all([getDashboardKpis(actor), getDashboardWidgets(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {actor.name}.</p>
      </div>

      {/* Client Metrics / Production Volumes (spec section 3) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Active clients" value={kpis.totalActiveClients} />
        <KpiCard label="New clients this month" value={kpis.newClientsThisMonth} />
        <KpiCard label="Active orders" value={kpis.activeOrders} />
        <KpiCard label="Pending scripts" value={kpis.pendingScripts} />
        <KpiCard label="Upcoming shoots" value={kpis.upcomingShoots} />
      </div>

      {/* Video Pipeline (spec section 3) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Video pipeline</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <PipelineStat label="In production" value={kpis.videoPipeline.inProduction} />
          <PipelineStat label="Pending approval" value={kpis.videoPipeline.pendingApproval} />
          <PipelineStat label="Under revision" value={kpis.videoPipeline.underRevision} />
          <PipelineStat label="Delivered" value={kpis.videoPipeline.delivered} />
        </CardContent>
      </Card>

      {/* Financial Summary — Owner/Admin only (spec section 2) */}
      {kpis.financial ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <PipelineStat label="Receivables" value={formatCurrency(kpis.financial.totalReceivables)} />
            <PipelineStat label="Pending invoices" value={kpis.financial.pendingInvoices} />
            <PipelineStat label="Monthly revenue" value={formatCurrency(kpis.financial.monthlyRevenue)} />
            <PipelineStat label="Monthly expenses" value={formatCurrency(kpis.financial.monthlyExpenses)} />
            <PipelineStat
              label="Est. net profit"
              value={formatCurrency(kpis.financial.netProfit)}
              tone={kpis.financial.netProfit >= 0 ? "success" : "danger"}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s shoots &amp; urgent tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {widgets.todaysShoots.length === 0 && widgets.urgentTasks.length === 0 ? (
              <span className="text-muted-foreground">Nothing urgent today.</span>
            ) : (
              <>
                {widgets.todaysShoots.map((shoot) => (
                  <Link
                    key={shoot.id}
                    href={`/shoots/${shoot.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
                  >
                    <span>Shoot: {shoot.script.title}</span>
                    <StatusBadge status={shoot.status} />
                  </Link>
                ))}
                {widgets.urgentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
                  >
                    <span>Task: {task.title}</span>
                    <StatusBadge status={task.priority} />
                  </Link>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bottleneck trackers</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <PipelineStat label="Overdue tasks" value={widgets.overdueTasks.length} tone="danger" />
            <PipelineStat label="Pending script approvals" value={widgets.pendingScriptApprovals.length} />
            <PipelineStat label="Pending edits" value={widgets.pendingEdits.length} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client action required</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {widgets.pendingClientVideoApprovals.length === 0 ? (
              <span className="text-muted-foreground">No videos awaiting client approval.</span>
            ) : (
              widgets.pendingClientVideoApprovals.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
                >
                  <span>{video.title}</span>
                  <StatusBadge status={video.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {widgets.activityFeed.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity feed</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {widgets.activityFeed.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-muted-foreground">
                  <span>
                    {(entry.profile?.name ?? entry.client?.companyName ?? "System") + " · "}
                    {entry.action.replaceAll("_", " ").toLowerCase()}
                  </span>
                  <span className="text-xs">{entry.createdAt.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function PipelineStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "danger";
}) {
  const toneClass = tone === "success" ? "text-emerald-400" : tone === "danger" ? "text-red-400" : "";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xl font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
