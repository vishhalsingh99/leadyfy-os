import { redirect } from "next/navigation";
import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { signOut } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

const PORTAL_NAV = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/orders", label: "Orders" },
  { href: "/portal/scripts", label: "Scripts" },
  { href: "/portal/videos", label: "Videos" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/support", label: "Support" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActorOrRedirect();
  if (actor.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-primary">Leadyfy</span>
          <nav className="hidden gap-4 md:flex">
            {PORTAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{actor.name}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
