"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PendingOverlay } from "@/components/pending-overlay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTaskSchema, taskStatusValues, taskPriorityValues, type CreateTaskInput } from "@/lib/validations/task";
import type { TaskFormResult } from "./actions";

type AssigneeOption = { id: string; name: string };
type OrderOption = { id: string; packageName: string };

type Props = {
  action: (prev: TaskFormResult, formData: FormData) => Promise<TaskFormResult>;
  assignees: AssigneeOption[];
  orders: OrderOption[];
  defaultValues?: Partial<CreateTaskInput>;
  submitLabel: string;
};

export function TaskForm({ action, assignees, orders, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<TaskFormResult, FormData>(action, undefined);
  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      orderId: defaultValues?.orderId ?? "",
      assigneeId: defaultValues?.assigneeId ?? "",
      status: defaultValues?.status ?? "TODO",
      priority: defaultValues?.priority ?? "MEDIUM",
      dueDate: defaultValues?.dueDate ?? "",
    },
  });

  function onSubmit(values: CreateTaskInput) {
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => fd.append(key, String(value ?? "")));
    formAction(fd);
  }

  return (
    <form
      action={formAction}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex max-w-xl flex-col gap-4"
    >
      <PendingOverlay active={isPending} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...form.register("description")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Assignee</Label>
        <Select
          defaultValue={form.getValues("assigneeId") || undefined}
          onValueChange={(value) => value && form.setValue("assigneeId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Related order</Label>
        <Select
          defaultValue={form.getValues("orderId") || undefined}
          onValueChange={(value) => value && form.setValue("orderId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {orders.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.packageName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Priority</Label>
          <Select
            defaultValue={form.getValues("priority")}
            onValueChange={(value) => form.setValue("priority", value as CreateTaskInput["priority"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskPriorityValues.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            defaultValue={form.getValues("status")}
            onValueChange={(value) => form.setValue("status", value as CreateTaskInput["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskStatusValues.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="mt-2 w-fit">
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
