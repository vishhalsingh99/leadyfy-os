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
import {
  createCreatorPayoutSchema,
  creatorPayoutStatusValues,
  type CreateCreatorPayoutInput,
} from "@/lib/validations/creator-payout";
import type { CreatorPayoutFormResult } from "./actions";

type CreatorOption = { id: string; name: string };
type ShootOption = { id: string; scheduledAt: Date; creator: { name: string } };

type Props = {
  action: (prev: CreatorPayoutFormResult, formData: FormData) => Promise<CreatorPayoutFormResult>;
  creators: CreatorOption[];
  shoots: ShootOption[];
  defaultValues?: Partial<CreateCreatorPayoutInput>;
  submitLabel: string;
};

export function CreatorPayoutForm({ action, creators, shoots, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<CreatorPayoutFormResult, FormData>(action, undefined);
  const form = useForm<CreateCreatorPayoutInput>({
    resolver: zodResolver(createCreatorPayoutSchema),
    defaultValues: {
      creatorId: defaultValues?.creatorId ?? creators[0]?.id ?? "",
      shootId: defaultValues?.shootId ?? "",
      videoCount: defaultValues?.videoCount ?? 1,
      amount: defaultValues?.amount ?? 0,
      status: defaultValues?.status ?? "PENDING",
      paidAt: defaultValues?.paidAt ?? "",
      reference: defaultValues?.reference ?? "",
    },
  });

  function onSubmit(values: CreateCreatorPayoutInput) {
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
        <Label>Creator</Label>
        <Select
          defaultValue={form.getValues("creatorId")}
          onValueChange={(value) => value && form.setValue("creatorId", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {creators.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Shoot (optional)</Label>
        <Select
          defaultValue={form.getValues("shootId") || undefined}
          onValueChange={(value) => value && form.setValue("shootId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {shoots.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.creator.name} — {s.scheduledAt.toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="videoCount">Video count</Label>
          <Input
            id="videoCount"
            type="number"
            min={1}
            {...form.register("videoCount", { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount (INR)</Label>
          <Input id="amount" type="number" min={0} step="0.01" {...form.register("amount", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="paidAt">Paid on</Label>
          <Input id="paidAt" type="date" {...form.register("paidAt")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reference">Reference</Label>
          <Input id="reference" {...form.register("reference")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          defaultValue={form.getValues("status")}
          onValueChange={(value) => form.setValue("status", value as CreateCreatorPayoutInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {creatorPayoutStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
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
