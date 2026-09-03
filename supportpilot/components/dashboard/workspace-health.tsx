import Link from "next/link";
import type { DraftCapResult } from "@/lib/billing/plans";

const OPEN = "#fa520f";
const PENDING = "#4d8bff";
const RESOLVED = "#3dd68c";
const USED = "#a78bfa";
const REMAINING = "#5b8def";

export function WorkspaceHealth({
  openCount,
  pendingCount,
  resolvedCount,
  drafts,
  documents,
  inboundAddress,
}: {
  openCount: number;
  pendingCount: number;
  resolvedCount: number;
  drafts: DraftCapResult;
  documents: { total: number; indexed: number; failed: number };
  inboundAddress: string | null;
}) {
  const total = openCount + pendingCount + resolvedCount;
  const parts = [
    { label: "Open", value: openCount, color: OPEN },
    { label: "Pending", value: pendingCount, color: PENDING },
    { label: "Resolved", value: resolvedCount, color: RESOLVED },
  ];
  const usageBars = [
    { label: "Drafts used", value: drafts.used, max: Math.max(drafts.cap, 1), color: USED },
    {
      label: "Remaining",
      value: drafts.remaining,
      max: Math.max(drafts.cap, 1),
      color: REMAINING,
    },
  ];

  return (
    <section className="flex h-full flex-col gap-3">
      <div className="rounded-2xl bg-[#111] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-white/45">Queue mix</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] leading-none tracking-tight text-white">
              {total}
            </p>
          </div>
          <Link href="/dashboard/tickets" className="text-[13px] text-white/35 hover:text-white">
            Inbox
          </Link>
        </div>
        <div className="mt-5 flex items-center gap-6">
          <QueueDonut parts={parts} total={total} />
          <ul className="min-w-0 flex-1 space-y-3">
            {parts.map((part) => (
              <li key={part.label} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 text-white/55">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: part.color }} />
                  {part.label}
                </span>
                <span className="tabular-nums text-white">
                  {part.value}
                  {total > 0 ? (
                    <span className="ml-2 text-white/30">
                      {Math.round((part.value / total) * 100)}%
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-1 flex-col rounded-2xl bg-[#111] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-white/45">Usage</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[28px] leading-none tracking-tight text-white">
              {drafts.used}
              <span className="text-[16px] text-white/30"> / {drafts.cap}</span>
            </p>
          </div>
          <Link href="/dashboard/settings#plan" className="text-[13px] text-white/35 hover:text-white">
            Plan
          </Link>
        </div>
        <ul className="mt-6 space-y-4">
          {usageBars.map((bar) => {
            const pct = Math.round((bar.value / bar.max) * 100);
            return (
              <li key={bar.label}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-white/55">{bar.label}</span>
                  <span className="tabular-nums text-white">
                    {bar.value}
                    <span className="ml-2 text-white/30">{pct}%</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, pct)}%`, background: bar.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-auto pt-4 text-[13px] text-white/40">
          {drafts.blocked ? "Cap reached this month." : `${drafts.remaining} drafts remaining this month.`}
        </p>
        <Link href="/dashboard/knowledge" className="mt-2 block text-[13px] text-white/55 hover:text-white">
          {documents.total === 0
            ? "No policy uploaded"
            : `${documents.indexed} indexed${documents.failed ? `, ${documents.failed} failed` : ""}`}
        </Link>
        <Link
          href="/dashboard/settings#mailbox"
          className="mt-1 truncate font-mono text-[12px] text-white/35 hover:text-white"
        >
          {inboundAddress ?? "Inbound not connected"}
        </Link>
      </div>
    </section>
  );
}

function QueueDonut({
  parts,
  total,
}: {
  parts: { label: string; value: number; color: string }[];
  total: number;
}) {
  const size = 132;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <svg width={size} height={size} className="shrink-0" aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
      </svg>
    );
  }

  const segments: { label: string; color: string; len: number; dashOffset: number }[] = [];
  let cursor = 0;
  for (const part of parts) {
    if (part.value <= 0) continue;
    const len = (part.value / total) * circ;
    segments.push({ label: part.label, color: part.color, len, dashOffset: -cursor });
    cursor += len;
  }

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      {segments.map((segment) => (
        <circle
          key={segment.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={segment.color}
          strokeWidth={stroke}
          strokeDasharray={`${segment.len} ${circ - segment.len}`}
          strokeDashoffset={segment.dashOffset}
        />
      ))}
    </svg>
  );
}
