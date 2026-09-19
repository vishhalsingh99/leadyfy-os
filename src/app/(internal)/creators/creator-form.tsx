"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCreatorSchema, type CreateCreatorInput } from "@/lib/validations/creator";
import type { CreatorFormResult } from "./actions";

type Props = {
  action: (prev: CreatorFormResult, formData: FormData) => Promise<CreatorFormResult>;
  defaultValues?: Partial<CreateCreatorInput>;
  submitLabel: string;
};

export function CreatorForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<CreatorFormResult, FormData>(action, undefined);
  const form = useForm<CreateCreatorInput>({
    resolver: zodResolver(createCreatorSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      city: defaultValues?.city ?? "",
      languages: defaultValues?.languages ?? "",
      niches: defaultValues?.niches ?? "",
      ratePerVideo: defaultValues?.ratePerVideo ?? 0,
    },
  });

  function onSubmit(values: CreateCreatorInput) {
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
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="languages">Languages</Label>
          <Input id="languages" {...form.register("languages")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="niches">Niches</Label>
          <Input id="niches" {...form.register("niches")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ratePerVideo">Rate per video (INR)</Label>
        <Input
          id="ratePerVideo"
          type="number"
          min={0}
          step="0.01"
          {...form.register("ratePerVideo", { valueAsNumber: true })}
        />
        {form.formState.errors.ratePerVideo ? (
          <p className="text-sm text-destructive">{form.formState.errors.ratePerVideo.message}</p>
        ) : null}
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="mt-2 w-fit">
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
