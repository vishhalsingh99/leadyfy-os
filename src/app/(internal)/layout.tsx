import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActorOrRedirect();
  if (actor.role === "CLIENT") redirect("/portal");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={actor.role} />
      <div className="flex flex-1 flex-col">
        <Topbar actor={actor} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
