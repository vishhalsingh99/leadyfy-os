"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { creatorAvailabilityStatusValues } from "@/lib/validations/creator";
import { setAvailabilityAction } from "./actions";

export function AvailabilityQuickSet({ creatorId }: { creatorId: string }) {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      <Select value={status} onValueChange={(v) => v && setStatus(v)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {creatorAvailabilityStatusValues.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        disabled={!date || isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await setAvailabilityAction(creatorId, date, status);
              toast.success("Availability updated");
              setDate("");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not update availability");
            }
          })
        }
      >
        Set
      </Button>
    </div>
  );
}
