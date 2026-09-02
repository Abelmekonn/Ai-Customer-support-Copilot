import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-xl border border-hairline-strong bg-[#0c0c0c] p-6",
        className,
      )}
    >
      <div className="mb-6">
        <h2 className="text-[18px] font-medium tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-[52ch] text-[14px] leading-6 text-steel">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsNav() {
  const items = [
    { href: "#plan", label: "Plan" },
    { href: "#workspace", label: "Workspace" },
    { href: "#team", label: "Team" },
    { href: "#mailbox", label: "Mailbox" },
  ];

  return (
    <nav
      aria-label="Settings sections"
      className="sticky top-0 z-20 -mx-6 border-b border-hairline-soft bg-black/85 px-6 py-3 backdrop-blur-md"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="inline-flex h-9 items-center rounded-full px-4 text-[14px] text-steel transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
