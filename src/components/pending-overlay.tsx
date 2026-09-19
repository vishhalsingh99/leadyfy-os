"use client";

import { Loader2 } from "lucide-react";

// Drop into any form/action while its own isPending is true. Distinct from
// RouteLoading (which Next.js renders automatically between page
// navigations) — this covers the gap between clicking submit and the
// action actually finishing, before any navigation has started.
export function PendingOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-5 shadow-lg">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Saving…</span>
      </div>
    </div>
  );
}
