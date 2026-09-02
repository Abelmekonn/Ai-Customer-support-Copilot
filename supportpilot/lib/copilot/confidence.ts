import type { ConfidenceBreakdown } from "@/lib/ai/types";

export function calculateConfidence(input: {
  retrievalQuality: number;
  sourceCoverage: number;
  intentConfidence: number;
}): ConfidenceBreakdown {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const retrievalQuality = clamp(input.retrievalQuality);
  const sourceCoverage = clamp(input.sourceCoverage);
  const intentConfidence = clamp(input.intentConfidence);
  const overall = Number(
    ((retrievalQuality * 0.45 + sourceCoverage * 0.3 + intentConfidence * 0.25)).toFixed(4),
  );

  return { retrievalQuality, sourceCoverage, intentConfidence, overall };
}
