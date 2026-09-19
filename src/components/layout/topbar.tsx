import { signOut } from "@/lib/actions/auth-actions";
import { listNotifications } from "@/lib/services/notification-service";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import type { Actor } from "@/lib/rbac";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  CLIENT: "Client",
};

export async function Topbar({ actor }: { actor: Actor }) {
  const subLabel = actor.employeeRole ? ` · ${actor.employeeRole.replaceAll("_", " ")}` : "";
  // Notifications are supplementary, not critical path — a transient DB
  // hiccup here shouldn't take down the whole page's render (which is
  // exactly what was happening: an uncaught error mid-render here was
  // surfacing downstream as a confusing React hooks-mismatch error).
  const notifications = await listNotifications(actor).catch(() => []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <div className="text-sm text-muted-foreground">
        {ROLE_LABELS[actor.role]}
        {subLabel}
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell notifications={notifications} />
        <span className="text-sm font-medium">{actor.name}</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
