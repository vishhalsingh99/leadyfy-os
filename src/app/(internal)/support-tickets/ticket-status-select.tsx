"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSupportTicketStatusAction } from "./actions";
import type { SupportTicketStatus } from "@prisma/client";

const STATUSES: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) =>
        value &&
        startTransition(async () => {
          try {
            await updateSupportTicketStatusAction(ticketId, value as SupportTicketStatus);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not update status");
          }
        })
      }
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
