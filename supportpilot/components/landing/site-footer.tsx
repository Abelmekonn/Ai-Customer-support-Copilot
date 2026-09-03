import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { SunsetStripe } from "@/components/brand/sunset-stripe";
import { Reveal } from "@/components/motion/reveal";

function footerColumns(signedIn: boolean) {
  return [
    {
      title: "Product",
      links: [
        ["Tickets", "/dashboard/tickets"],
        ["Knowledge", "/dashboard/knowledge"],
        ["Analytics", "/dashboard/analytics"],
        ["Pipeline", "/#pipeline"],
      ],
    },
    {
      title: "Workspace",
      links: signedIn
        ? [
            ["Open workspace", "/dashboard"],
            ["Settings", "/dashboard/settings"],
          ]
        : [
            ["Sign in", "/login"],
            ["Create workspace", "/register"],
            ["Settings", "/dashboard/settings"],
          ],
    },
    {
      title: "Company",
      links: [
        ["Why it exists", "/#product"],
        ["How the pipeline works", "/#pipeline"],
        signedIn ? ["Open workspace", "/dashboard"] : ["Start a workspace", "/register"],
      ],
    },
  ] as const;
}

export function SiteFooter({ signedIn = false }: { signedIn?: boolean }) {
  const columns = footerColumns(signedIn);
  return (
    <footer className="bg-black">
      <SunsetStripe />
      <div className="mx-auto max-w-[1280px] px-8 pt-20 pb-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(0,1fr))]">
          <Reveal className="sm:col-span-2 lg:col-span-1">
            <BrandMark inverted />
            <p className="mt-5 max-w-[280px] text-[15px] leading-[1.55] text-white/50">
              Multi-tenant copilot for support agents. RAG, sources, and a human
              in the loop.
            </p>
          </Reveal>
          {columns.map((column, index) => (
            <Reveal key={column.title} delay={0.06 * (index + 1)}>
              <p className="text-[13px] font-semibold tracking-[0.02em] text-white">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map(([label, href]) => (
                  <li key={`${column.title}-${label}`}>
                    <Link
                      href={href}
                      className="text-[14px] text-white/55 transition-colors duration-150 hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <Reveal
          delay={0.08}
          className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-[13px] text-white/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© {new Date().getFullYear()} SupportPilot</p>
          <p>Built for agents — the model never sends the customer reply.</p>
        </Reveal>
      </div>
    </footer>
  );
}
