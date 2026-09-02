import { formatPercent } from "@/lib/utils";

export function ConfidenceScore({ value }: { value?: number }) {
  if (value == null) {
    return (
      <div>
        <p className="typo-eyebrow text-steel">Confidence</p>
        <p className="mt-2 text-[14px] leading-[1.5] text-steel">
          Calculated from retrieval quality, source coverage, and intent — not a
          model self-score.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="typo-eyebrow text-steel">Confidence</p>
      <p className="typo-stat mt-1">{formatPercent(value)}</p>
    </div>
  );
}
