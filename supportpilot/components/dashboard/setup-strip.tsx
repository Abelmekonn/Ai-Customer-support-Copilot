import Link from "next/link";
import { Check } from "lucide-react";
import { LoadSampleTickets } from "@/components/demo/load-sample-tickets";

export function SetupStrip({
  hasPolicy,
  hasInbound,
  hasTickets,
  isDemo,
}: {
  hasPolicy: boolean;
  hasInbound: boolean;
  hasTickets: boolean;
  isDemo: boolean;
}) {
  const steps = [
    {
      done: hasPolicy,
      title: "Upload a policy",
      body: "Drafts cite this workspace policy, or they refuse.",
      href: "/dashboard/knowledge",
      action: "Open knowledge",
    },
    {
      done: hasInbound,
      title: "Connect inbound email",
      body: "Forward customer mail. New messages become tickets.",
      href: "/dashboard/settings#mailbox",
      action: "Open mailbox",
    },
    {
      done: hasTickets,
      title: "Get the first ticket",
      body: isDemo
        ? "Load a sample inbox, or wait for a real forward."
        : "Send a test email to the inbound address.",
      href: "/dashboard/settings#mailbox",
      action: "Open mailbox",
    },
  ];

  if (steps.every((step) => step.done)) return null;

  return (
    <section className="rounded-2xl bg-[#111] p-5">
      <h2 className="text-[15px] font-medium">Set up this workspace</h2>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl bg-white/[0.03] px-4 py-4">
            <p className="flex items-center gap-2 text-[12px] text-white/40">
              {step.done ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <span className="font-mono">{index + 1}</span>
              )}
              {step.done ? "Done" : "Next"}
            </p>
            <p className="mt-2 text-[14px] font-medium">{step.title}</p>
            <p className="mt-1 text-[13px] leading-5 text-white/40">{step.body}</p>
            {step.done ? null : index === 2 && isDemo && !hasTickets ? (
              <div className="mt-3">
                <LoadSampleTickets />
              </div>
            ) : (
              <Link href={step.href} className="mt-3 inline-block text-[13px] font-medium text-primary">
                {step.action}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
