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
import { createShootSchema, shootStatusValues, type CreateShootInput } from "@/lib/validations/shoot";
import type { ShootFormResult } from "./actions";

type ScriptOption = { id: string; title: string; order: { client: { companyName: string } } };
type CreatorOption = { id: string; name: string };

type Props = {
  action: (prev: ShootFormResult, formData: FormData) => Promise<ShootFormResult>;
  scripts: ScriptOption[];
  creators: CreatorOption[];
  defaultValues?: Partial<CreateShootInput>;
  submitLabel: string;
};

export function ShootForm({ action, scripts, creators, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<ShootFormResult, FormData>(action, undefined);
  const form = useForm<CreateShootInput>({
    resolver: zodResolver(createShootSchema),
    defaultValues: {
      scriptId: defaultValues?.scriptId ?? scripts[0]?.id ?? "",
      creatorId: defaultValues?.creatorId ?? creators[0]?.id ?? "",
      scheduledAt: defaultValues?.scheduledAt ?? "",
      location: defaultValues?.location ?? "",
      notes: defaultValues?.notes ?? "",
      status: defaultValues?.status ?? "SCHEDULED",
    },
  });

  function onSubmit(values: CreateShootInput) {
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
        <Label>Script</Label>
        <Select
          defaultValue={form.getValues("scriptId")}
          onValueChange={(value) => value && form.setValue("scriptId", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scripts.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.order.client.companyName} — {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.scriptId ? (
          <p className="text-sm text-destructive">{form.formState.errors.scriptId.message}</p>
        ) : null}
      </div>

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
        {form.formState.errors.creatorId ? (
          <p className="text-sm text-destructive">{form.formState.errors.creatorId.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="scheduledAt">Date &amp; time</Label>
        <Input id="scheduledAt" type="datetime-local" {...form.register("scheduledAt")} />
        {form.formState.errors.scheduledAt ? (
          <p className="text-sm text-destructive">{form.formState.errors.scheduledAt.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...form.register("location")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          defaultValue={form.getValues("status")}
          onValueChange={(value) => form.setValue("status", value as CreateShootInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {shootStatusValues.map((s) => (
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
