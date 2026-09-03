import Link from "next/link";
import { ArrowUpRight, BookOpen, Calendar, Inbox, Sparkles, Timer } from "lucide-react";

export function HomeGreeting({
  fullName,
  primary,
}: {
  fullName: string;
  primary: { href: string; label: string };
}) {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0] ?? "there";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="typo-heading-1">Home</h1>
        <p className="mt-2 text-[14px] text-white/45">
          {daypart()}, {first}. Draft from policy, then you send.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-[#141414] px-3.5 text-[13px] text-white/70">
          <Calendar className="size-3.5 text-white/40" strokeWidth={1.75} />
          This month
        </span>
        <Link
          href={primary.href}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06]"
        >
          {primary.label}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function KpiRow({
  open,
  unassigned,
  pending,
  draftsUsed,
  draftsCap,
  draftsRemaining,
  indexed,
  failed,
}: {
  open: number;
  unassigned: number;
  pending: number;
  draftsUsed: number;
  draftsCap: number;
  draftsRemaining: number;
  indexed: number;
  failed: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Open tickets"
        value={String(open)}
        href="/dashboard/tickets"
        icon={Inbox}
        hint={
          unassigned > 0
            ? `${unassigned} unassigned`
            : open > 0
              ? "In the queue"
              : "Inbox is clear"
        }
      />
      <KpiCard
        label="Pending"
        value={String(pending)}
        href="/dashboard/tickets?status=pending"
        icon={Timer}
        hint={pending > 0 ? "Waiting on customer" : "None waiting"}
      />
      <KpiCard
        label="Drafts this month"
        value={`${draftsUsed} / ${draftsCap}`}
        href="/dashboard/settings#plan"
        icon={Sparkles}
        hint={draftsRemaining <= 0 ? "Cap reached" : `${draftsRemaining} remaining`}
      />
      <KpiCard
        label="Indexed docs"
        value={String(indexed)}
        href="/dashboard/knowledge"
        icon={BookOpen}
        hint={failed > 0 ? `${failed} failed` : indexed > 0 ? "Ready to cite" : "Upload a policy"}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  href: string;
  icon: typeof Inbox;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-[#111] p-5 transition-colors hover:bg-[#161616]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-white/45">{label}</p>
        <Icon className="size-4 text-white/25" strokeWidth={1.75} />
      </div>
      <p className="mt-4 font-[family-name:var(--font-display)] text-[34px] leading-none tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-[13px] text-white/40">{hint}</p>
    </Link>
  );
}

function daypart(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
