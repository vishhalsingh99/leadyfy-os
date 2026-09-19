import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/validations/task";

// Tasks are personal/team todos, not client-scoped — Owner/Admin see
// everything for oversight, everyone else sees only what's assigned to them.
function taskScopeFor(actor: Actor): Prisma.TaskWhereInput {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return {};
  return { assigneeId: actor.profileId };
}

function canEditTask(actor: Actor, task: { assigneeId: string | null }) {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return true;
  return task.assigneeId === actor.profileId;
}

export async function listTasks(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.task.findMany({
    where: taskScopeFor(actor),
    include: { assignee: { select: { name: true } }, order: { select: { packageName: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function getTask(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const task = await prisma.task.findFirst({
    where: { id, ...taskScopeFor(actor) },
    include: { assignee: { select: { name: true, id: true } }, order: { select: { packageName: true } } },
  });
  if (!task) throw new ForbiddenError("Task not found or not accessible");
  return task;
}

// Any internal role can create a task; only Owner/Admin or the assignee can
// edit it afterward (self-service status updates, per spec section 8).
export async function listAssigneeOptions() {
  const profiles = await prisma.profile.findMany({
    where: { role: { in: ["OWNER", "ADMIN", "EMPLOYEE"] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return profiles;
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function createTask(actor: Actor, input: CreateTaskInput) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const data = createTaskSchema.parse(input);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      orderId: data.orderId || null,
      assigneeId: data.assigneeId || null,
      status: data.status,
      priority: data.priority,
      dueDate: toDateOrNull(data.dueDate),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "TASK_CREATED", entityType: "Task", entityId: task.id },
  });

  return task;
}

export async function updateTask(actor: Actor, id: string, input: UpdateTaskInput) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const existing = await prisma.task.findFirst({ where: { id, ...taskScopeFor(actor) } });
  if (!existing) throw new ForbiddenError("Task not found or not accessible");
  if (!canEditTask(actor, existing)) {
    throw new ForbiddenError("Only the assignee or Owner/Admin can edit this task");
  }

  const data = updateTaskSchema.parse(input);

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.orderId !== undefined && { orderId: data.orderId || null }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: toDateOrNull(data.dueDate) }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "TASK_UPDATED", entityType: "Task", entityId: task.id },
  });

  return task;
}
