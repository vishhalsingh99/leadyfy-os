"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { createScriptSchema, scriptStatusValues, type CreateScriptInput } from "@/lib/validations/script";
import type { ScriptFormResult } from "./actions";

type OrderOption = { id: string; packageName: string; client: { companyName: string } };
type WriterOption = { id: string; name: string };

type Props = {
  action: (prev: ScriptFormResult, formData: FormData) => Promise<ScriptFormResult>;
  orders: OrderOption[];
  writers: WriterOption[];
  defaultValues?: Partial<CreateScriptInput>;
  submitLabel: string;
};

export function ScriptForm({ action, orders, writers, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<ScriptFormResult, FormData>(action, undefined);
  const form = useForm<CreateScriptInput>({
    resolver: zodResolver(createScriptSchema),
    defaultValues: {
      orderId: defaultValues?.orderId ?? orders[0]?.id ?? "",
      assignedToId: defaultValues?.assignedToId ?? "",
      videoNumber: defaultValues?.videoNumber ?? 1,
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      language: defaultValues?.language ?? "English",
      status: defaultValues?.status ?? "DRAFT",
      deadline: defaultValues?.deadline ?? "",
    },
  });

  function onSubmit(values: CreateScriptInput) {
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => fd.append(key, String(value ?? "")));
    formAction(fd);
  }

  return (
    <form
      action={formAction}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex max-w-2xl flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label>Order</Label>
        <Select
          defaultValue={form.getValues("orderId")}
          onValueChange={(value) => value && form.setValue("orderId", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orders.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.client.companyName} — {o.packageName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.orderId ? (
          <p className="text-sm text-destructive">{form.formState.errors.orderId.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="videoNumber">Video #</Label>
          <Input
            id="videoNumber"
            type="number"
            min={1}
            {...form.register("videoNumber", { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="language">Language</Label>
          <Input id="language" {...form.register("language")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Script content</Label>
        <Textarea id="content" rows={8} {...form.register("content")} />
        {form.formState.errors.content ? (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Assigned writer</Label>
        <Select
          defaultValue={form.getValues("assignedToId") || undefined}
          onValueChange={(value) => value && form.setValue("assignedToId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            {writers.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...form.register("deadline")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            defaultValue={form.getValues("status")}
            onValueChange={(value) => form.setValue("status", value as CreateScriptInput["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scriptStatusValues.map((s) => (
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
