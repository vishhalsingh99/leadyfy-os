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
import { createPaymentSchema, paymentStatusValues, type CreatePaymentInput } from "@/lib/validations/payment";
import type { PaymentFormResult } from "./actions";

type OrderOption = { id: string; packageName: string; client: { companyName: string } };

type Props = {
  action: (prev: PaymentFormResult, formData: FormData) => Promise<PaymentFormResult>;
  orders: OrderOption[];
  defaultValues?: Partial<CreatePaymentInput>;
  submitLabel: string;
};

export function PaymentForm({ action, orders, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<PaymentFormResult, FormData>(action, undefined);
  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      orderId: defaultValues?.orderId ?? orders[0]?.id ?? "",
      invoiceNumber: defaultValues?.invoiceNumber ?? "",
      amount: defaultValues?.amount ?? 0,
      amountPaid: defaultValues?.amountPaid ?? 0,
      status: defaultValues?.status ?? "UNPAID",
      method: defaultValues?.method ?? "",
      transactionRef: defaultValues?.transactionRef ?? "",
      dueDate: defaultValues?.dueDate ?? "",
      paidAt: defaultValues?.paidAt ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  function onSubmit(values: CreatePaymentInput) {
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="invoiceNumber">Invoice number</Label>
        <Input id="invoiceNumber" {...form.register("invoiceNumber")} />
        {form.formState.errors.invoiceNumber ? (
          <p className="text-sm text-destructive">{form.formState.errors.invoiceNumber.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount (INR)</Label>
          <Input id="amount" type="number" min={0} step="0.01" {...form.register("amount", { valueAsNumber: true })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amountPaid">Amount paid (INR)</Label>
          <Input
            id="amountPaid"
            type="number"
            min={0}
            step="0.01"
            {...form.register("amountPaid", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="method">Method</Label>
          <Input id="method" {...form.register("method")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="transactionRef">Transaction ref</Label>
          <Input id="transactionRef" {...form.register("transactionRef")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paidAt">Paid on</Label>
          <Input id="paidAt" type="date" {...form.register("paidAt")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          defaultValue={form.getValues("status")}
          onValueChange={(value) => form.setValue("status", value as CreatePaymentInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentStatusValues.map((s) => (
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
