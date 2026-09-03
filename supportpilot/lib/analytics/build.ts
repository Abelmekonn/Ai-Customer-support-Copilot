export function utcDayKeys(days: number, now = new Date()) {
  const keys: string[] = [];
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - i);
    keys.push(day.toISOString().slice(0, 10));
  }
  return keys;
}

export function utcWindowStart(days: number, now = new Date()) {
  const first = utcDayKeys(days, now)[0];
  return `${first}T00:00:00.000Z`;
}

export function dayLabel(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function percent(part: number, total: number) {
  if (total <= 0) return null;
  return Math.round((part / total) * 100);
}

export function isNoSource(sourceCoverage: number | null | undefined) {
  return Number(sourceCoverage ?? 0) <= 0;
}

type TicketRow = { status: string; priority: string; created_at: string };
type GenerationRow = {
  source_coverage: number | null;
  retrieval_quality: number | null;
  approved_at: string | null;
  created_at: string;
};
type UsageRow = { type: string; quantity: number | string | null; created_at: string };
type DocumentRow = { status: string };
type MessageRow = { send_status: string | null };

export type AnalyticsInput = {
  tickets: TicketRow[];
  generations: GenerationRow[];
  usage: UsageRow[];
  documents: DocumentRow[];
  messages: MessageRow[];
  draftsUsedMonth: number;
  draftsCap: number;
  now?: Date;
};

export type DaySeries = {
  key: string;
  label: string;
  tickets: number;
  drafts: number;
  sent: number;
};

export type AnalyticsSnapshot = {
  days: DaySeries[];
  rangeLabel: string;
  queue: { open: number; pending: number; resolved: number; total: number };
  priority: { high: number; medium: number; low: number };
  drafts: { used: number; cap: number; remaining: number };
  copilot: {
    drafts: number;
    sent: number;
    grounded: number;
    noSource: number;
    sendRate: number | null;
    noSourceRate: number | null;
    avgRetrieval: number | null;
  };
  mail: { sent: number; failed: number; queued: number };
  documents: { total: number; indexed: number; failed: number };
};

const DAYS = 14;

function quantityOf(value: number | string | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function buildAnalytics(input: AnalyticsInput): AnalyticsSnapshot {
  const now = input.now ?? new Date();
  const keys = utcDayKeys(DAYS, now);
  const ticketsByDay = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;
  const draftsByDay = { ...ticketsByDay };
  const sentByDay = { ...ticketsByDay };

  for (const ticket of input.tickets) {
    const key = ticket.created_at.slice(0, 10);
    if (key in ticketsByDay) ticketsByDay[key] += 1;
  }

  for (const event of input.usage) {
    const key = event.created_at.slice(0, 10);
    const qty = quantityOf(event.quantity);
    if (event.type === "draft" && key in draftsByDay) draftsByDay[key] += qty;
    if (event.type === "email_out" && key in sentByDay) sentByDay[key] += qty;
  }

  const days: DaySeries[] = keys.map((key) => ({
    key,
    label: dayLabel(key),
    tickets: ticketsByDay[key] ?? 0,
    drafts: draftsByDay[key] ?? 0,
    sent: sentByDay[key] ?? 0,
  }));

  const queue = {
    open: input.tickets.filter((ticket) => ticket.status === "open").length,
    pending: input.tickets.filter((ticket) => ticket.status === "pending").length,
    resolved: input.tickets.filter((ticket) => ticket.status === "resolved").length,
    total: input.tickets.length,
  };

  const generations = input.generations;
  const noSource = generations.filter((row) => isNoSource(row.source_coverage)).length;
  const grounded = generations.length - noSource;
  const sentDrafts = generations.filter((row) => Boolean(row.approved_at)).length;
  const retrievals = generations
    .map((row) => Number(row.retrieval_quality))
    .filter((value) => Number.isFinite(value));
  const avgRetrieval =
    retrievals.length === 0
      ? null
      : Number((retrievals.reduce((sum, value) => sum + value, 0) / retrievals.length).toFixed(2));

  return {
    days,
    rangeLabel: `${days[0]?.label ?? ""} – ${days[days.length - 1]?.label ?? ""}`,
    queue,
    priority: {
      high: input.tickets.filter((ticket) => ticket.priority === "high").length,
      medium: input.tickets.filter((ticket) => ticket.priority === "medium").length,
      low: input.tickets.filter((ticket) => ticket.priority === "low").length,
    },
    drafts: {
      used: input.draftsUsedMonth,
      cap: input.draftsCap,
      remaining: Math.max(0, input.draftsCap - input.draftsUsedMonth),
    },
    copilot: {
      drafts: generations.length,
      sent: sentDrafts,
      grounded,
      noSource,
      sendRate: percent(sentDrafts, generations.length),
      noSourceRate: percent(noSource, generations.length),
      avgRetrieval,
    },
    mail: {
      sent: input.messages.filter((row) => row.send_status === "sent").length,
      failed: input.messages.filter((row) => row.send_status === "failed").length,
      queued: input.messages.filter((row) => row.send_status === "queued").length,
    },
    documents: {
      total: input.documents.length,
      indexed: input.documents.filter((row) => row.status === "indexed").length,
      failed: input.documents.filter((row) => row.status === "failed").length,
    },
  };
}
