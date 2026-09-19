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
import { createVideoSchema, videoStatusValues, type CreateVideoInput } from "@/lib/validations/video";
import type { VideoFormResult } from "./actions";

type ScriptOption = { id: string; title: string; order: { client: { companyName: string } } };
type EditorOption = { id: string; name: string };

type Props = {
  action: (prev: VideoFormResult, formData: FormData) => Promise<VideoFormResult>;
  scripts: ScriptOption[];
  editors: EditorOption[];
  defaultValues?: Partial<CreateVideoInput>;
  submitLabel: string;
};

export function VideoForm({ action, scripts, editors, defaultValues, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<VideoFormResult, FormData>(action, undefined);
  const form = useForm<CreateVideoInput>({
    resolver: zodResolver(createVideoSchema),
    defaultValues: {
      scriptId: defaultValues?.scriptId ?? scripts[0]?.id ?? "",
      shootId: defaultValues?.shootId ?? "",
      editorId: defaultValues?.editorId ?? "",
      title: defaultValues?.title ?? "",
      status: defaultValues?.status ?? "SCRIPT_APPROVED",
      deadline: defaultValues?.deadline ?? "",
    },
  });

  function onSubmit(values: CreateVideoInput) {
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
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Editor</Label>
        <Select
          defaultValue={form.getValues("editorId") || undefined}
          onValueChange={(value) => value && form.setValue("editorId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            {editors.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
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
            onValueChange={(value) => form.setValue("status", value as CreateVideoInput["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {videoStatusValues.map((s) => (
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
