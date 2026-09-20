"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PendingOverlay } from "@/components/pending-overlay";
import { approvePortalVideoAction, requestPortalVideoRevisionAction } from "./actions";

export function VideoApprovalActions({ videoId }: { videoId: string }) {
  const [comment, setComment] = useState("");
  const [timestampSec, setTimestampSec] = useState("");
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
                await approvePortalVideoAction(videoId);
                toast.success("Video approved");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not approve");
              }
            })
          }
        >
          Approve final edit
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">At timestamp (seconds, optional):</span>
            <Input
              type="number"
              min={0}
              className="w-24"
              value={timestampSec}
              onChange={(e) => setTimestampSec(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={isPending || !comment.trim()}
            onClick={() =>
              startTransition(async () => {
                try {
                  await requestPortalVideoRevisionAction(
                    videoId,
                    comment,
                    timestampSec ? Number(timestampSec) : undefined,
                  );
                  toast.success("Revision requested");
                  setComment("");
                  setTimestampSec("");
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
