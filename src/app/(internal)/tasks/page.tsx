import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listTasks } from "@/lib/services/task-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default async function TasksPage() {
  const actor = await getActorOrRedirect();
  const tasks = await listTasks(actor);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} task{tasks.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/tasks/new">New task</Link>} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const overdue = task.dueDate && task.dueDate < today && task.status !== "DONE";
            return (
              <TableRow key={task.id}>
                <TableCell>
                  <Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
                <TableCell>
                  <StatusBadge status={task.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell className={overdue ? "text-red-400" : "text-muted-foreground"}>
                  {task.dueDate ? task.dueDate.toLocaleDateString() : "—"}
                  {overdue ? " (overdue)" : ""}
                </TableCell>
              </TableRow>
            );
          })}
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No tasks in your scope yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
