import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SunsetStripe } from "@/components/brand/sunset-stripe";
import { getCurrentUser, getOrganization } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const organization = await getOrganization(user.organization_id);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar
          name={user.full_name}
          role={user.role}
          organizationName={organization?.name ?? "Workspace"}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[#0a0a0a]">{children}</div>
      </div>
      <SunsetStripe />
    </div>
  );
}
