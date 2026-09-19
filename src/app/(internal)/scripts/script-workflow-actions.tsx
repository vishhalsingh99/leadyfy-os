"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { advanceScriptStatusAction } from "./actions";

// Calls the imported Server Action directly (Next.js handles the RPC) —
// this is a workflow affordance, not a data-entry form, so it doesn't need
// the no-JS <form action> fallback the create/edit forms have.
export function ScriptWorkflowActions({ scriptId, options }: { scriptId: string; options: string[] }) {
  const [isPending, startTransition] = useTransition();
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((status) => (
        <Button
          key={status}
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await advanceScriptStatusAction(scriptId, status);
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
