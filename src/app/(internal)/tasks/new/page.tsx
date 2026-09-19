import { getActorOrRedirect } from "@/lib/rbac";
import { listAssigneeOptions } from "@/lib/services/task-service";
import { listOrders } from "@/lib/services/order-service";
import { TaskForm } from "../task-form";
import { createTaskAction } from "../actions";

export default async function NewTaskPage() {
  const actor = await getActorOrRedirect();
  const [assignees, orders] = await Promise.all([listAssigneeOptions(), listOrders(actor)]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New task</h1>
      <TaskForm action={createTaskAction} assignees={assignees} orders={orders} submitLabel="Create task" />
    </div>
  );
}
