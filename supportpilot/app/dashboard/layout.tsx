import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SunsetStripe } from "@/components/brand/sunset-stripe";
import { getCurrentUser } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader name={user.full_name} role={user.role} />
          <div className="min-h-0 flex-1 overflow-hidden bg-surface">{children}</div>
        </div>
      </div>
      <SunsetStripe />
    </div>
  );
}
