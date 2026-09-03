import Link from "next/link";
import { ArrowRight, FileSearch, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { PipelineZigZag } from "@/components/landing/pipeline-zigzag";
import { SiteFooter } from "@/components/landing/site-footer";
import { MotionRoot } from "@/components/motion/motion-root";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const signedIn = Boolean(user);

  return (
    <MotionRoot>
      <div className="min-h-full bg-black text-white">
        <div className="border-b border-white/10 bg-black px-6 py-3 text-center text-[14px] font-medium text-white/70">
          Built for agents — the model never sends the customer reply.
        </div>

        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-8">
            <BrandMark inverted />
            <nav className="hidden items-center gap-6 text-[14px] font-medium text-white/60 sm:flex">
              <Link href="#product">Product</Link>
              <Link href="#pipeline">Pipeline</Link>
              {signedIn ? null : <Link href="/login">Sign in</Link>}
            </nav>
            <Button variant="dark" asChild>
              <Link href={signedIn ? "/dashboard" : "/register"}>
                {signedIn ? "Open workspace" : "Start workspace"}
              </Link>
            </Button>
          </div>
        </header>

        <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-black">
          <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1280px] items-center gap-12 px-8 py-16 md:grid-cols-2 md:py-24">
            <Reveal className="relative z-10 max-w-xl">
              <p className="typo-eyebrow text-primary">Frontier support. In your hands.</p>
              <h1 className="typo-hero-display mt-4 text-white">
                Draft accurate replies.
                <br />
                Then you send them.
              </h1>
              <p className="typo-subtitle mt-6 text-white/60">
                SupportPilot classifies the ticket, retrieves company policy, and
                suggests a sourced response. Confidence is calculated. The agent
                stays responsible.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="dark" asChild>
                  <Link href={signedIn ? "/dashboard" : "/register"}>
                    {signedIn ? "Open workspace" : "Create a workspace"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {signedIn ? null : (
                  <Button variant="outline" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                )}
              </div>
            </Reveal>

            <Reveal
              delay={0.12}
              className="relative z-10 flex min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#161616] text-white"
            >
              <div className="flex items-center justify-between px-10 pt-8 text-[13px] text-white/40">
                <span>Ticket #1042</span>
                <span>High · Billing</span>
              </div>
              <div className="flex flex-1 flex-col px-10 pb-8 pt-8">
                <p className="text-[15px] text-white/45">Sarah Johnson</p>
                <p className="mt-4 text-[22px] font-medium leading-[1.4] tracking-[-0.02em] text-white">
                  “I was charged twice for my subscription. Can I get a refund?”
                </p>
                <div className="mt-10 flex flex-1 flex-col rounded-[20px] bg-[#0a0a0a] p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-primary">
                    Intent · Billing / Duplicate charge
                  </p>
                  <p className="mt-5 flex-1 text-[16px] leading-7 text-white/90">
                    I’m sorry about the duplicate charge. According to our billing
                    policy, we refund the extra payment within 5–7 business days…
                  </p>
                  <p className="mt-8 text-[13px] text-white/40">
                    93% confidence · 3 sources
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="product" className="bg-black">
          <div className="mx-auto max-w-[1280px] px-8 py-24">
            <Reveal>
              <p className="typo-eyebrow text-primary">Why it exists</p>
              <h2 className="typo-heading-1 mt-3 text-white">
                A copilot pipeline, not a chatbot wrapper.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Sparkles,
                  title: "Intent first",
                  body: "Structured classification before retrieval, so the search query matches policy language.",
                },
                {
                  icon: FileSearch,
                  title: "Grounded RAG",
                  body: "Chunked documents, embeddings, reranking, and citations — built without a chain abstraction.",
                },
                {
                  icon: ShieldCheck,
                  title: "Explainable confidence",
                  body: "Scores from retrieval quality, source coverage, and classification — not a made-up 97%.",
                },
                {
                  icon: UserRoundCheck,
                  title: "Human in the loop",
                  body: "Edit, regenerate, or approve. Nothing reaches the customer until an agent sends it.",
                },
              ].map((feature, index) => (
                <Reveal
                  key={feature.title}
                  delay={index * 0.06}
                  className="rounded-[28px] border border-white/10 bg-[#111] p-8"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="typo-heading-5 mt-5 text-white">{feature.title}</h3>
                  <p className="mt-2 text-[16px] leading-[1.55] text-white/55">{feature.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <PipelineZigZag signedIn={signedIn} />

        <section className="bg-black px-8 py-24">
          <Reveal className="mx-auto max-w-[1280px] rounded-[28px] border border-white/10 bg-[#111] px-8 py-16 text-center md:px-16">
            <h2 className="typo-heading-1 text-white">The next chapter of support is yours.</h2>
            <p className="typo-subtitle mx-auto mt-4 max-w-xl text-white/60">
              Put an AI copilot next to every ticket — grounded in your knowledge,
              sent by your team.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="dark" asChild>
                <Link href={signedIn ? "/dashboard" : "/register"}>
                  {signedIn ? "Open workspace" : "Create workspace"}
                </Link>
              </Button>
              {signedIn ? null : (
                <Button variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </Reveal>
        </section>

        <SiteFooter signedIn={signedIn} />
      </div>
    </MotionRoot>
  );
}
