"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createTask, updateTask } from "@/lib/services/task-service";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/task";

export type TaskFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createTaskAction(
  _prev: TaskFormResult,
  formData: FormData,
): Promise<TaskFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createTaskSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let taskId: string;
  try {
    const task = await createTask(actor, parsed.data);
    taskId = task.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/tasks");
  redirect(`/tasks/${taskId}`);
}

export async function updateTaskAction(
  id: string,
  _prev: TaskFormResult,
  formData: FormData,
): Promise<TaskFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateTask(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  redirect(`/tasks/${id}`);
}
