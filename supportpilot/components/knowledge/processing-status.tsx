import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/lib/types";

const STEPS: { id: DocumentStatus; label: string }[] = [
  { id: "queued", label: "Queued" },
  { id: "extracting", label: "Extracting" },
  { id: "chunking", label: "Chunking" },
  { id: "embedding", label: "Embedding" },
  { id: "indexed", label: "Indexed" },
];

export function ProcessingStatus({ current }: { current?: DocumentStatus }) {
  const normalized: DocumentStatus | undefined =
    current === "uploading" ? "queued" : current === "failed" ? undefined : current;
  const currentIndex = normalized
    ? STEPS.findIndex((step) => step.id === normalized)
    : -1;

  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {STEPS.map((step, index) => {
        const done = currentIndex > index || normalized === "indexed";
        const active = step.id === normalized && normalized !== "indexed";
        return (
          <li
            key={step.id}
            className={cn(
              "rounded-lg border px-3 py-2 text-center text-xs font-medium",
              done
                ? "border-beige-deep bg-cream text-ink"
                : active
                  ? "border-primary bg-canvas text-primary"
                  : "border-hairline-soft bg-canvas text-steel",
            )}
          >
            {step.label}
            {done && step.id === "indexed" ? " ✓" : ""}
          </li>
        );
      })}
    </ol>
  );
}
