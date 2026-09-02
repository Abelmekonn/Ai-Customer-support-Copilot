"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Ticket,
  Users,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  organizationName,
}: {
  organizationName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="text-sidebar-foreground">
          <Logo markClassName="bg-primary/90" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3">
        {NAV.map((item) => {
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
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="truncate text-xs text-sidebar-foreground/50">Workspace</p>
        <p className="truncate text-sm text-sidebar-foreground/90">
          {organizationName}
        </p>
      </div>
    </aside>
  );
}
