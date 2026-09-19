"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPortalTicketAction, type SupportFormResult } from "./actions";

export function TicketForm() {
  const [state, formAction, isPending] = useActionState<SupportFormResult, FormData>(
    createPortalTicketAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={4} required />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Submitting..." : "Submit ticket"}
      </Button>
    </form>
  );
}
