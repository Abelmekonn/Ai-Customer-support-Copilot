"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  LineChart,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@/lib/types";
import { canViewAnalytics } from "@/lib/auth/roles";
import { cn, initials } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ name, role }: { name: string; role: UserRole }) {
  const pathname = usePathname();
  const nav = items.filter((item) => item.href !== "/dashboard/analytics" || canViewAnalytics(role));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-black text-white">
      <div className="flex h-16 items-center gap-2.5 px-4">
        <img src="/logo.svg" alt="" className="size-7" />
        <span className="text-[15px] font-medium tracking-tight">SupportPilot</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] font-medium transition-colors duration-150",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-white/10 text-[12px] font-semibold text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{name}</p>
            <p className="text-[12px] capitalize text-white/40">{role}</p>
          </div>
        </div>
        <SignOutButton className="mt-1 w-full rounded-md px-3 py-2 text-left hover:bg-white/8" />
      </div>
    </aside>
  );
}
