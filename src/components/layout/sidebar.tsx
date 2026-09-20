"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SystemRole } from "@prisma/client";
import { internalNavItems } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: SystemRole }) {
  const pathname = usePathname();
  const items = internalNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
      <div className="mb-6 px-2 text-lg font-semibold text-primary">Leadyfy OS</div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                active && "bg-sidebar-accent text-sidebar-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
