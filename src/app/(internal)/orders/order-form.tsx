"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PendingOverlay } from "@/components/pending-overlay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrderSchema, orderStatusValues, type CreateOrderInput } from "@/lib/validations/order";
import type { OrderFormResult } from "./actions";

type ClientOption = { id: string; companyName: string };

type Props = {
  action: (prev: OrderFormResult, formData: FormData) => Promise<OrderFormResult>;
  clients: ClientOption[];
  defaultValues?: Partial<CreateOrderInput>;
  submitLabel: string;
};

export function OrderForm({ action, clients, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<OrderFormResult, FormData>(action, undefined);
  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      clientId: defaultValues?.clientId ?? clients[0]?.id ?? "",
      packageName: defaultValues?.packageName ?? "",
      videoCount: defaultValues?.videoCount ?? 10,
      totalValue: defaultValues?.totalValue ?? 0,
      status: defaultValues?.status ?? "NEW",
      startDate: defaultValues?.startDate ?? "",
      dueDate: defaultValues?.dueDate ?? "",
    },
  });

  function onSubmit(values: CreateOrderInput) {
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
        <Label>Client</Label>
        <Select
          defaultValue={form.getValues("clientId")}
          onValueChange={(value) => value && form.setValue("clientId", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.clientId ? (
          <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="packageName">Package name</Label>
        <Input id="packageName" {...form.register("packageName")} />
        {form.formState.errors.packageName ? (
          <p className="text-sm text-destructive">{form.formState.errors.packageName.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="videoCount">Contracted video count</Label>
          <Input
            id="videoCount"
            type="number"
            min={1}
            {...form.register("videoCount", { valueAsNumber: true })}
          />
          {form.formState.errors.videoCount ? (
            <p className="text-sm text-destructive">{form.formState.errors.videoCount.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="totalValue">Total value (INR)</Label>
          <Input
            id="totalValue"
            type="number"
            min={0}
            step="0.01"
            {...form.register("totalValue", { valueAsNumber: true })}
          />
          {form.formState.errors.totalValue ? (
            <p className="text-sm text-destructive">{form.formState.errors.totalValue.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          defaultValue={form.getValues("status")}
          onValueChange={(value) => form.setValue("status", value as CreateOrderInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="mt-2 w-fit">
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
