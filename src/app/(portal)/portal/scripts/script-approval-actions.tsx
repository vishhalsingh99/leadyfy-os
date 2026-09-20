"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PendingOverlay } from "@/components/pending-overlay";
import { approvePortalScriptAction, requestPortalScriptRevisionAction } from "./actions";

export function ScriptApprovalActions({ scriptId }: { scriptId: string }) {
  const [comment, setComment] = useState("");
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <PendingOverlay active={isPending} />
      <div className="flex gap-2">
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              try {
                await approvePortalScriptAction(scriptId);
                toast.success("Script approved");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not approve");
              }
            })
          }
        >
          Approve
        </Button>
        <Button variant="outline" disabled={isPending} onClick={() => setShowRevisionBox((v) => !v)}>
          Request revision
        </Button>
      </div>
      {showRevisionBox ? (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="What needs to change?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            disabled={isPending || !comment.trim()}
            onClick={() =>
              startTransition(async () => {
                try {
                  await requestPortalScriptRevisionAction(scriptId, comment);
                  toast.success("Revision requested");
                  setComment("");
                  setShowRevisionBox(false);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not submit");
                }
              })
            }
          >
            Submit revision request
          </Button>
        </div>
      ) : null}
    </div>
  );
}
