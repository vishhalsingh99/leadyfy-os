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
import {
  clientStatusValues,
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validations/client";
import type { ClientFormResult } from "./actions";

type Props = {
  action: (prev: ClientFormResult, formData: FormData) => Promise<ClientFormResult>;
  defaultValues?: Partial<CreateClientInput>;
  submitLabel: string;
};

// Client-side validation (react-hook-form + the same zod schema the server
// uses) gives immediate feedback; the Server Action re-validates and
// authorizes independently — the form never has to be trusted.
export function ClientForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<ClientFormResult, FormData>(action, undefined);
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      companyName: defaultValues?.companyName ?? "",
      contactName: defaultValues?.contactName ?? "",
      contactEmail: defaultValues?.contactEmail ?? "",
      contactPhone: defaultValues?.contactPhone ?? "",
      industry: defaultValues?.industry ?? "",
      status: defaultValues?.status ?? "LEAD",
    },
  });

  function onSubmit(values: CreateClientInput) {
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => fd.append(key, value ?? ""));
    formAction(fd);
  }

  return (
    <form
      action={formAction}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex max-w-xl flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" {...form.register("companyName")} />
        {form.formState.errors.companyName ? (
          <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contactName">Contact name</Label>
        <Input id="contactName" {...form.register("contactName")} />
        {form.formState.errors.contactName ? (
          <p className="text-sm text-destructive">{form.formState.errors.contactName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contactEmail">Contact email</Label>
        <Input id="contactEmail" type="email" {...form.register("contactEmail")} />
        {form.formState.errors.contactEmail ? (
          <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contactPhone">Phone</Label>
        <Input id="contactPhone" {...form.register("contactPhone")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="industry">Industry</Label>
        <Input id="industry" {...form.register("industry")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          defaultValue={form.getValues("status")}
          onValueChange={(value) => form.setValue("status", value as CreateClientInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clientStatusValues.map((s) => (
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
