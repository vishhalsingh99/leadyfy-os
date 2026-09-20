"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PendingOverlay } from "@/components/pending-overlay";
import { advanceVideoStatusAction } from "./actions";

export function VideoWorkflowActions({ videoId, options }: { videoId: string; options: string[] }) {
  const [isPending, startTransition] = useTransition();
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <PendingOverlay active={isPending} />
      {options.map((status) => (
        <Button
          key={status}
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await advanceVideoStatusAction(videoId, status);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not update status");
              }
            })
          }
        >
          Move to {status.replaceAll("_", " ")}
        </Button>
      ))}
    </div>
  );
}
