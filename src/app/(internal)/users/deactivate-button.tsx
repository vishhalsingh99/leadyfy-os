"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PendingOverlay } from "@/components/pending-overlay";
import { setProfileActiveAction } from "./actions";

export function DeactivateButton({ profileId, isActive }: { profileId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <PendingOverlay active={isPending} />
      <Button
        size="sm"
        variant={isActive ? "outline" : "default"}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await setProfileActiveAction(profileId, !isActive);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not update user");
            }
          })
        }
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </Button>
    </>
  );
}
