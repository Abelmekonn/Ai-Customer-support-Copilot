import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import {
  ArrowRight,
  Check,
  FileSearch,
  FileText,
  Layers,
  PenLine,
  ScanSearch,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

const STEPS = [
  {
    title: "Intent detection",
    body: "The ticket is classified into structured JSON — intent, category, and urgency — before any retrieval runs.",
    visual: "intent",
  },
  {
    title: "Query rewriting",
    body: "The customer’s messy message becomes a retrieval query that matches policy language, not chat slang.",
    visual: "rewrite",
  },
  {
    title: "Knowledge retrieval",
    body: "Embeddings search policies, FAQs, product docs, and past solutions for the top matching chunks.",
    visual: "retrieve",
  },
  {
    title: "Reranking",
    body: "The first ten hits are scored again so only the five best passages reach the model.",
    visual: "rerank",
  },
  {
    title: "Draft + sources",
    body: "Claude writes a structured reply from those passages only — with citations, never invented policy.",
    visual: "draft",
  },
  {
    title: "Agent review",
    body: "The human edits, regenerates, or approves. SupportPilot never sends the customer the message.",
    visual: "review",
  },
] as const;

export function PipelineZigZag({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section id="pipeline" className="bg-black py-28">
      <div className="mx-auto max-w-[1280px] px-8">
        <Reveal>
          <p className="typo-eyebrow text-primary">The pipeline</p>
          <h2 className="typo-heading-1 mt-3 text-white">
            Six steps. One accountable agent.
          </h2>
          <p className="typo-subtitle mt-4 max-w-2xl text-white/60">
            Intent, query rewriting, retrieval, reranking, structured generation,
            then human review.
          </p>
        </Reveal>

        <div className="mt-24 space-y-28">
          {STEPS.map((step, index) => {
            const visualLeft = index % 2 === 0;
            return (
              <Reveal key={step.title}>
                <article className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
                  <div className={visualLeft ? "lg:order-1" : "lg:order-2"}>
                    <StepVisual kind={step.visual} index={index + 1} />
                  </div>
                  <div className={visualLeft ? "lg:order-2" : "lg:order-1"}>
                    <p className="typo-eyebrow text-primary">Step {index + 1}</p>
                    <h3 className="typo-heading-1 mt-3 text-white">{step.title}</h3>
                    <p className="typo-subtitle mt-4 max-w-md text-white/60">
                      {step.body}
                    </p>
                    <Link
                      href={signedIn ? "/dashboard" : "/register"}
                      className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-black"
                    >
                      {signedIn ? "Open workspace" : "Start workspace"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StepVisual({
  kind,
  index,
}: {
  kind: (typeof STEPS)[number]["visual"];
  index: number;
}) {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#111]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-[15px] font-semibold text-black">
            {index}
          </span>
          <span className="text-[13px] text-white/45">Ticket #1042</span>
        </div>
        <StepIcon kind={kind} />
      </div>
      <div className="p-5 sm:p-6">
        {kind === "intent" ? <IntentVisual /> : null}
        {kind === "rewrite" ? <RewriteVisual /> : null}
        {kind === "retrieve" ? <RetrieveVisual /> : null}
        {kind === "rerank" ? <RerankVisual /> : null}
        {kind === "draft" ? <DraftVisual /> : null}
        {kind === "review" ? <ReviewVisual /> : null}
      </div>
    </div>
  );
}

function StepIcon({ kind }: { kind: (typeof STEPS)[number]["visual"] }) {
  const className = "size-5 text-primary";
  if (kind === "intent") return <Sparkles className={className} />;
  if (kind === "rewrite") return <PenLine className={className} />;
  if (kind === "retrieve") return <FileSearch className={className} />;
  if (kind === "rerank") return <Layers className={className} />;
  if (kind === "draft") return <ScanSearch className={className} />;
  return <UserRoundCheck className={className} />;
}

function IntentVisual() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-black p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-white/35">
          Customer
        </p>
        <p className="mt-2 text-[14px] font-medium text-white">Sarah Johnson</p>
        <p className="mt-3 rounded-xl bg-white/5 p-3 text-[14px] leading-6 text-white/80">
          I was charged twice for my subscription. Can I get a refund?
        </p>
      </div>
      <div className="space-y-2.5 font-mono text-[13px]">
        <p className="text-[11px] font-sans font-semibold uppercase tracking-[1px] text-white/35">
          Classification
        </p>
        <Row label="intent" value="billing" />
        <Row label="category" value="duplicate_charge" />
        <Row label="urgency" value="high" />
        <Row label="confidence" value="0.94" accent />
      </div>
    </div>
  );
}

function RewriteVisual() {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1px] text-white/35">
          Original ticket
        </p>
        <p className="rounded-2xl bg-black px-4 py-4 text-[15px] leading-6 text-white/50">
          “I was charged twice for my subscription. Can I get a refund?”
        </p>
      </div>
      <div className="flex justify-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary">
          <ArrowRight className="size-4 rotate-90" />
        </span>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1px] text-primary">
          Retrieval query
        </p>
        <p className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-4 text-[15px] leading-6 text-white">
          duplicate subscription charge refund eligibility billing policy
        </p>
      </div>
    </div>
  );
}

function RetrieveVisual() {
  const docs = [
    ["Refund Policy.pdf", "Page 4", 0.91],
    ["Billing Guide.pdf", "Section 3", 0.88],
    ["Duplicate Payment FAQ", "All", 0.86],
    ["Subscription FAQ.md", "Page 1", 0.74],
  ] as const;

  return (
    <div className="space-y-2.5">
      {docs.map(([name, loc, score]) => (
        <div key={name} className="rounded-2xl bg-black px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-[14px] text-white">{name}</p>
                <p className="text-[12px] text-white/35">{loc}</p>
              </div>
            </div>
            <span className="font-mono text-[13px] text-primary">{score.toFixed(2)}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RerankVisual() {
  const items = [
    { name: "Refund Policy", keep: true, score: 0.94 },
    { name: "Billing Guide", keep: true, score: 0.91 },
    { name: "Duplicate FAQ", keep: true, score: 0.89 },
    { name: "Subscription FAQ", keep: true, score: 0.84 },
    { name: "Account Recovery", keep: true, score: 0.81 },
    { name: "Shipping Policy", keep: false, score: 0.62 },
    { name: "Product Docs", keep: false, score: 0.54 },
  ];

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center justify-between text-[12px] text-white/40">
        <span>10 retrieved</span>
        <span className="text-primary">5 kept</span>
      </div>
      {items.map((item) => (
        <div
          key={item.name}
          className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-[13px] ${
            item.keep ? "bg-black text-white" : "bg-black/40 text-white/30"
          }`}
        >
          <span>{item.name}</span>
          {item.keep ? (
            <Check className="size-4 text-primary" />
          ) : (
            <span className="font-mono text-[12px]">{item.score}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DraftVisual() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-black p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-primary">
          Suggested response
        </p>
        <p className="mt-3 text-[15px] leading-7 text-white/85">
          I’m sorry about the duplicate charge. According to our billing policy,
          we can refund the extra $49 within 5–7 business days. I’ve flagged the
          second payment on your account.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Refund Policy · p.4", "Billing Guide · §3", "Duplicate FAQ"].map((source) => (
          <span
            key={source}
            className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] text-white/70"
          >
            {source}
          </span>
        ))}
      </div>
      <p className="font-mono text-[13px] text-white/40">confidence 93%</p>
    </div>
  );
}

function ReviewVisual() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black p-4 text-[14px] leading-6 text-white/75">
        I’m sorry about the duplicate charge. According to our billing policy…
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["Edit", "Regenerate", "Approve"].map((action) => (
          <span
            key={action}
            className="rounded-full bg-white/8 px-4 py-2.5 text-center text-[13px] font-medium text-white/70"
          >
            {action}
          </span>
        ))}
        <span className="rounded-full bg-primary px-4 py-2.5 text-center text-[13px] font-medium text-white">
          Send reply
        </span>
      </div>
      <p className="text-[13px] text-white/40">
        AI drafts. The agent is the one who sends.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-full bg-black px-4 py-3">
      <span className="text-white/40">{label}</span>
      <span className={accent ? "text-primary" : "text-white"}>{value}</span>
    </div>
  );
}
