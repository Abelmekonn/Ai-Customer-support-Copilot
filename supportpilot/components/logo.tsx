import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          markClassName,
        )}
      >
        <Compass className="size-4" strokeWidth={2.25} />
      </span>
      <span className="font-semibold tracking-tight">SupportPilot</span>
    </div>
  );
}
