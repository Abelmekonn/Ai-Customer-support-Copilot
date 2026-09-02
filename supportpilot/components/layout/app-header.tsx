"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { initials } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Support overview",
  "/dashboard/tickets": "Tickets",
  "/dashboard/knowledge": "Knowledge base",
  "/dashboard/customers": "Customers",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

export function AppHeader({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const title =
    titles[pathname] ??
    (pathname.startsWith("/dashboard/tickets/")
      ? "Ticket workspace"
      : "SupportPilot");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline-soft bg-canvas px-6">
      <p className="text-[14px] font-medium">{title}</p>
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-white/10 text-[13px] font-semibold text-white">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight sm:block">
          <p className="text-[14px] font-medium">{name}</p>
          <p className="text-[12px] capitalize text-steel">{role}</p>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
