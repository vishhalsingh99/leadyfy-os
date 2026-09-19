import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getTask, listAssigneeOptions } from "@/lib/services/task-service";
import { listOrders } from "@/lib/services/order-service";
import { canEditTask } from "@/lib/permissions";
import { TaskForm } from "../../task-form";
import { updateTaskAction } from "../../actions";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const task = await getTask(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!task) notFound();
  if (!canEditTask(actor, task)) redirect(`/tasks/${id}`);

  const [assignees, orders] = await Promise.all([listAssigneeOptions(), listOrders(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {task.title}</h1>
      <TaskForm
        action={updateTaskAction.bind(null, id)}
        assignees={assignees}
        orders={orders}
        submitLabel="Save changes"
        defaultValues={{
          title: task.title,
          description: task.description ?? "",
          orderId: task.orderId ?? "",
          assigneeId: task.assigneeId ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: toDateInputValue(task.dueDate),
        }}
      />
    </div>
  );
}
