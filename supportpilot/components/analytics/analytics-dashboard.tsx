import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, FileWarning, Inbox, Send, Sparkles } from "lucide-react";
import { HomeSearch } from "@/components/dashboard/home-search";
import { DonutChart, LineChart } from "@/components/analytics/charts";
import type { AnalyticsSnapshot } from "@/lib/analytics/build";

const OPEN = "#fa520f";
const PENDING = "#4d8bff";
const RESOLVED = "#3dd68c";
const DRAFTS = "#a78bfa";
const SENT = "#5b8def";

export function AnalyticsDashboard({ data }: { data: AnalyticsSnapshot }) {
  const queueParts = [
    { label: "Open", value: data.queue.open, color: OPEN },
    { label: "Pending", value: data.queue.pending, color: PENDING },
    { label: "Resolved", value: data.queue.resolved, color: RESOLVED },
  ];
  const groundedParts = [
    { label: "Grounded", value: data.copilot.grounded, color: RESOLVED },
    { label: "No source", value: data.copilot.noSource, color: OPEN },
  ];
  const priorityParts = [
    { label: "High", value: data.priority.high, color: OPEN },
    { label: "Medium", value: data.priority.medium, color: "#ffb83e" },
    { label: "Low", value: data.priority.low, color: "rgba(255,255,255,0.25)" },
  ];
  const ticketTotal14 = data.days.reduce((sum, day) => sum + day.tickets, 0);
  const draftTotal14 = data.days.reduce((sum, day) => sum + day.drafts, 0);
  const sentTotal14 = data.days.reduce((sum, day) => sum + day.sent, 0);

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#0a0a0a]">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <HomeSearch />
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-7 pb-16">
        <div>
          <h1 className="typo-heading-1">Analytics</h1>
          <p className="mt-2 text-[14px] text-white/45">
            Drafts, send rate, and no-source refusals for this workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-[#141414] px-3.5 text-[13px] text-white/70">
            <Calendar className="size-3.5 text-white/40" strokeWidth={1.75} />
            Last 14 days · {data.rangeLabel}
          </span>
          <Link
            href="/dashboard/tickets"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.06]"
          >
            Open inbox
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Drafts this month"
            value={`${data.drafts.used} / ${data.drafts.cap}`}
            hint={data.drafts.remaining <= 0 ? "Cap reached" : `${data.drafts.remaining} remaining`}
            href="/dashboard/settings#plan"
            icon={Sparkles}
          />
          <Kpi
            label="Send rate"
            value={formatRate(data.copilot.sendRate)}
            hint={
              data.copilot.drafts === 0
                ? "No drafts yet"
                : `${data.copilot.sent} of ${data.copilot.drafts} drafts sent`
            }
            href="/dashboard/tickets"
            icon={Send}
          />
          <Kpi
            label="No-source rate"
            value={formatRate(data.copilot.noSourceRate)}
            hint={
              data.copilot.drafts === 0
                ? "Generate a draft to measure this"
                : `${data.copilot.noSource} without matching policy`
            }
            href="/dashboard/knowledge"
            icon={FileWarning}
          />
          <Kpi
            label="Open tickets"
            value={String(data.queue.open)}
            hint={data.queue.total === 0 ? "Queue is empty" : `${data.queue.total} in the workspace`}
            href="/dashboard/tickets"
            icon={Inbox}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
          <ChartCard
            title="Tickets and drafts"
            subtitle={`${ticketTotal14} new tickets · ${draftTotal14} drafts`}
          >
            <LineChart
              labels={data.days.map((day) => day.label)}
              series={[
                { label: "Tickets", color: OPEN, values: data.days.map((day) => day.tickets) },
                { label: "Drafts", color: DRAFTS, values: data.days.map((day) => day.drafts) },
              ]}
            />
            <Legend items={[{ label: "Tickets", color: OPEN }, { label: "Drafts", color: DRAFTS }]} />
          </ChartCard>
          <ChartCard title="Replies sent" subtitle={`${sentTotal14} outbound in this window`}>
            <LineChart
              labels={data.days.map((day) => day.label)}
              series={[{ label: "Sent", color: SENT, values: data.days.map((day) => day.sent) }]}
            />
            <p className="mt-3 text-[13px] text-white/40">
              {data.mail.failed > 0
                ? `${data.mail.failed} send${data.mail.failed === 1 ? "" : "s"} failed. Retry from the ticket.`
                : data.mail.queued > 0
                  ? `${data.mail.queued} still sending.`
                  : "Counted when an agent sends, not when a draft is generated."}
            </p>
          </ChartCard>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-[#111] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-white/45">Queue mix</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] leading-none tracking-tight text-white">
                  {data.queue.total}
                </p>
              </div>
              <Link href="/dashboard/tickets" className="text-[13px] text-white/35 hover:text-white">
                Inbox
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-6">
              <DonutChart parts={queueParts} total={data.queue.total} />
              <BreakdownList parts={queueParts} total={data.queue.total} />
            </div>
          </div>

          <div className="rounded-2xl bg-[#111] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-white/45">Grounding</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] leading-none tracking-tight text-white">
                  {formatRate(data.copilot.noSourceRate === null ? null : 100 - data.copilot.noSourceRate)}
                </p>
              </div>
              <Link href="/dashboard/knowledge" className="text-[13px] text-white/35 hover:text-white">
                Knowledge
              </Link>
            </div>
            <p className="mt-2 text-[13px] text-white/40">
              {data.copilot.avgRetrieval === null
                ? "Share of drafts that retrieved policy."
                : `Avg retrieval ${Math.round(data.copilot.avgRetrieval * 100)}%.`}
            </p>
            <ul className="mt-6 space-y-4">
              {groundedParts.map((part) => (
                <BarRow
                  key={part.label}
                  label={part.label}
                  value={part.value}
                  max={Math.max(data.copilot.drafts, 1)}
                  color={part.color}
                />
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-white/40">
              {data.documents.total === 0
                ? "No policy uploaded. Drafts will refuse until something is indexed."
                : `${data.documents.indexed} indexed${data.documents.failed ? `, ${data.documents.failed} failed` : ""}.`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111] p-5">
          <p className="text-[13px] text-white/45">Priority mix</p>
          <div className="mt-5 grid gap-6 md:grid-cols-[148px_minmax(0,1fr)] md:items-center">
            <DonutChart parts={priorityParts} total={data.queue.total} />
            <BreakdownList parts={priorityParts} total={data.queue.total} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof Inbox;
}) {
  return (
    <Link href={href} className="rounded-2xl bg-[#111] p-5 transition-colors hover:bg-[#161616]">
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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-[#111] p-5">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="mt-0.5 text-[13px] text-white/35">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-4 text-[13px] text-white/45">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className="size-1.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function BreakdownList({
  parts,
  total,
}: {
  parts: { label: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <ul className="min-w-0 flex-1 space-y-3">
      {parts.map((part) => (
        <li key={part.label} className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex items-center gap-2 text-white/55">
            <span className="size-1.5 rounded-full" style={{ background: part.color }} />
            {part.label}
          </span>
          <span className="tabular-nums text-white">
            {part.value}
            {total > 0 ? (
              <span className="ml-2 text-white/30">{Math.round((part.value / total) * 100)}%</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <li>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-white/55">{label}</span>
        <span className="tabular-nums text-white">
          {value}
          <span className="ml-2 text-white/30">{pct}%</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </li>
  );
}

function formatRate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}
