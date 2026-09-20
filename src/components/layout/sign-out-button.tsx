"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { PendingOverlay } from "@/components/pending-overlay";

// Reads pending state from the parent <form action={signOut}> via
// useFormStatus, so the server-rendered layouts that use this button don't
// need to become client components themselves.
export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <PendingOverlay active={pending} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        Sign out
      </Button>
    </>
  );
}
