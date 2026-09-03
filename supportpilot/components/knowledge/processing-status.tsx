import { Check, X } from "lucide-react";
import {
  INDEX_STEPS,
  displayStepIndex,
  indexingHint,
  indexingProgress,
  indexingTitle,
  isWaitingForRetry,
} from "@/lib/knowledge/pipeline";
import type { DocumentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProcessingStatus({
  current,
  fileName,
  error,
}: {
  current?: DocumentStatus;
  fileName?: string;
  error?: string | null;
}) {
  if (!current) return null;

  const failed = current === "failed";
  const waiting = isWaitingForRetry(current, error);
  const currentIndex = displayStepIndex(current, error);
  const progress = Math.round(indexingProgress(current, error) * 100);

  return (
    <div>
      <p
        className={cn(
          "text-[13px] font-medium",
          failed ? "text-primary" : waiting ? "text-[#ffd06a]" : "text-white/55",
        )}
      >
        {indexingTitle(current, error)}
      </p>
      <ol className="mt-3 flex items-start">
        {INDEX_STEPS.map((step, index) => {
          const done = !failed && (currentIndex > index || current === "indexed");
          const stoppedHere = failed && index === currentIndex;
          const active = !failed && index === currentIndex && current !== "indexed";
          const isLast = index === INDEX_STEPS.length - 1;
          const reached = done || active || stoppedHere || (failed && index < currentIndex);
          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    "h-px flex-1",
                    index === 0 ? "bg-transparent" : reached ? "bg-primary" : "bg-white/10",
                  )}
                />
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                    done || (failed && index < currentIndex)
                      ? "border-primary bg-primary text-white"
                      : stoppedHere
                        ? "border-primary bg-primary/20 text-primary"
                        : active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/15 bg-transparent text-white/30",
                    active && waiting ? "animate-pulse" : null,
                  )}
                >
                  {done || (failed && index < currentIndex) ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : stoppedHere ? (
                    <X className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "h-px flex-1",
                    isLast ? "bg-transparent" : done || (failed && index < currentIndex) ? "bg-primary" : "bg-white/10",
                  )}
                />
              </div>
              <p
                className={cn(
                  "mt-2 px-1 text-center text-[11px] leading-4 sm:text-[12px]",
                  done || (failed && index < currentIndex)
                    ? "text-white"
                    : stoppedHere || active
                      ? "text-primary"
                      : "text-white/35",
                )}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            failed ? "bg-primary" : waiting ? "bg-[#ffd06a]" : "bg-primary",
          )}
          style={{ width: `${Math.max(progress, failed || waiting ? 8 : 0)}%` }}
        />
      </div>
      <p
        className={cn("mt-3 text-[13px] leading-5", failed ? "text-white/70" : "text-white/45")}
        aria-live="polite"
      >
        {indexingHint(current, fileName, error)}
      </p>
    </div>
  );
}
