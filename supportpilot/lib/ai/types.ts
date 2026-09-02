export type CopilotSource = {
  chunkId: string;
  documentId: string;
  documentName: string;
  pageNumber?: number;
  similarity: number;
};

export type CopilotResult = {
  intent: string;
  category: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
  response: string;
  sources: CopilotSource[];
  needsHumanReview: boolean;
};

export type ConfidenceBreakdown = {
  retrievalQuality: number;
  sourceCoverage: number;
  intentConfidence: number;
  overall: number;
};
