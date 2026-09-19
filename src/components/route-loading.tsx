import { Loader2 } from "lucide-react";

// Rendered automatically by Next.js while a route segment's Server
// Component is fetching data — covers sidebar navigation, form-submit
// redirects, anywhere a page transition takes a moment. A blurred backdrop
// over the (stale) previous screen reads as "working" rather than a jarring
// blank flash or a raw error boundary showing up mid-transition.
export function RouteLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-5 shadow-lg">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
