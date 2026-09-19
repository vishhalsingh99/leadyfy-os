import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { listActivityLogs } from "@/lib/services/activity-log-service";
import { canViewSystemAdmin } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ActivityLogsPage() {
  const actor = await getActorOrRedirect();
  if (!canViewSystemAdmin(actor)) redirect("/dashboard");

  const logs = await listActivityLogs(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Most recent {logs.length} events</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.profile?.name ?? log.client?.companyName ?? "System"}</TableCell>
              <TableCell className="font-medium">{log.action.replaceAll("_", " ")}</TableCell>
              <TableCell className="text-muted-foreground">
                {log.entityType} · {log.entityId}
              </TableCell>
              <TableCell className="text-muted-foreground">{log.createdAt.toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No activity yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
