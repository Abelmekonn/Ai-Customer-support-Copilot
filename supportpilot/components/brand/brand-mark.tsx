import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <img src="/logo.svg" alt="" className="size-8" />
      <span
        className={cn(
          "text-[15px] font-medium tracking-tight",
          inverted ? "text-white" : "text-ink",
        )}
      >
        SupportPilot
      </span>
    </Link>
  );
}
