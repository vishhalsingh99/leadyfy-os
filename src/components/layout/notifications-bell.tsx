"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsReadAction } from "@/lib/actions/notification-actions";

type Notification = { id: string; message: string; isRead: boolean; createdAt: Date };

export function NotificationsBell({ notifications }: { notifications: Notification[] }) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => markAllNotificationsReadAction())}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-md px-2 py-2 text-sm ${n.isRead ? "text-muted-foreground" : "bg-accent"}`}
              >
                <div>{n.message}</div>
                <div className="text-xs text-muted-foreground">{n.createdAt.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
