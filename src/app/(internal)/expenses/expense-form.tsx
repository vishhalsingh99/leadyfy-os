"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpenseSchema, expenseCategoryValues, type CreateExpenseInput } from "@/lib/validations/expense";
import type { ExpenseFormResult } from "./actions";

type Props = {
  action: (prev: ExpenseFormResult, formData: FormData) => Promise<ExpenseFormResult>;
  defaultValues?: Partial<CreateExpenseInput>;
  submitLabel: string;
};

export function ExpenseForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<ExpenseFormResult, FormData>(action, undefined);
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      category: defaultValues?.category ?? expenseCategoryValues[0],
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount ?? 0,
      incurredAt: defaultValues?.incurredAt ?? new Date().toISOString().slice(0, 10),
    },
  });

  function onSubmit(values: CreateExpenseInput) {
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
      <div className="flex flex-col gap-2">
        <Label>Category</Label>
        <Select
          defaultValue={form.getValues("category")}
          onValueChange={(value) => value && form.setValue("category", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {expenseCategoryValues.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...form.register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount (INR)</Label>
          <Input id="amount" type="number" min={0} step="0.01" {...form.register("amount", { valueAsNumber: true })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="incurredAt">Date incurred</Label>
          <Input id="incurredAt" type="date" {...form.register("incurredAt")} />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="mt-2 w-fit">
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
