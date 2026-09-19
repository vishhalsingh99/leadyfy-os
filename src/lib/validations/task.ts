import { z } from "zod";

export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskPriorityValues = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().or(z.literal("")),
  orderId: z.string().trim().optional().or(z.literal("")),
  assigneeId: z.string().trim().optional().or(z.literal("")),
  status: z.enum(taskStatusValues),
  priority: z.enum(taskPriorityValues),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
