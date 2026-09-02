export const NO_POLICY_RESPONSE =
  "I don’t have indexed company policy that matches this ticket. Don’t promise a refund, timeline, or account change. Ask one clarifying question, or escalate to a lead.";

export function scoresFromRetrieval(similarities: number[]) {
  if (similarities.length === 0) {
    return { retrievalQuality: 0, sourceCoverage: 0 };
  }

  const retrievalQuality = Number(
    (similarities.reduce((sum, value) => sum + value, 0) / similarities.length).toFixed(4),
  );
  const sourceCoverage = Number(Math.min(1, similarities.length / 4).toFixed(4));
  return { retrievalQuality, sourceCoverage };
}
