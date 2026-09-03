"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Folder,
  Home,
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

const workspaceItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/tickets", label: "Inbox", icon: Ticket },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
];

export function AppSidebar({
  name,
  role,
  organizationName,
}: {
  name: string;
  role: UserRole;
  organizationName: string;
}) {
  const pathname = usePathname();
  const nav = workspaceItems.filter(
    (item) => item.href !== "/dashboard/analytics" || canViewAnalytics(role),
  );

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0a] text-white">
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-[#141414] px-2.5 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ffd06a] text-black">
            <Folder className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight">{organizationName}</p>
            <p className="text-[11px] text-white/35">Workspace</p>
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-white/30" />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
        <NavGroup items={nav} pathname={pathname} />
        <div>
          <p className="px-3 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-white/30">
            More
          </p>
          <NavLink
            href="/dashboard/settings"
            label="Settings"
            icon={Settings}
            active={pathname.startsWith("/dashboard/settings")}
          />
        </div>
      </nav>
      <div className="mt-auto border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-white/10 text-[12px] font-semibold text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{name}</p>
            <p className="text-[11px] capitalize text-white/35">{role}</p>
          </div>
        </div>
        <SignOutButton className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[13px] text-white/45 hover:bg-white/[0.06] hover:text-white" />
      </div>
    </aside>
  );
}

function NavGroup({
  items,
  pathname,
}: {
  items: { href: string; label: string; icon: typeof Home }[];
  pathname: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={active}
          />
        );
      })}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-[#1a1a1a] text-white"
          : "text-white/45 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
