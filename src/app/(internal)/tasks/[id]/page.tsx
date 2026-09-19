import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getTask } from "@/lib/services/task-service";
import { canEditTask } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const task = await getTask(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!task) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <StatusBadge status={task.priority} />
          <StatusBadge status={task.status} />
        </div>
        {canEditTask(actor, task) ? (
          <Button variant="outline" render={<Link href={`/tasks/${task.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <div>Assignee: {task.assignee?.name ?? "Unassigned"}</div>
          {task.order ? <div>Order: {task.order.packageName}</div> : null}
          <div className="text-muted-foreground">
            {task.dueDate ? `Due ${task.dueDate.toLocaleDateString()}` : "No due date"}
          </div>
          {task.description ? <p className="mt-2 whitespace-pre-wrap">{task.description}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
