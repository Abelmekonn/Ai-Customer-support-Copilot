import { z } from "zod";
import { copilotResultSchema } from "@/lib/ai/schemas";
import { NO_POLICY_RESPONSE } from "@/lib/rag/scores";

const DEFAULT_BASE_URL = "https://api.minimax.io/v1";
const DEFAULT_MODEL = "MiniMax-M3";

const draftSchema = copilotResultSchema.extend({
  intentConfidence: z.number().min(0).max(1),
});

export type MiniMaxDraft = z.infer<typeof draftSchema>;

export class MiniMaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MiniMaxError";
  }
}

export async function generateCopilotDraftFromThread(input: {
  ticketContext: string;
  policyPassages: string;
}): Promise<MiniMaxDraft> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    throw new MiniMaxError("Add MINIMAX_API_KEY to .env.local, then restart the dev server.");
  }

  const baseUrl = (process.env.MINIMAX_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = process.env.MINIMAX_MODEL?.trim() || DEFAULT_MODEL;
  const hasPolicy = Boolean(input.policyPassages.trim());

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_completion_tokens: 900,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "system",
          content: hasPolicy
            ? `You are SupportPilot, a copilot for human support agents. You never send mail to the customer.
Return JSON only, no markdown, with this shape:
{"intent":"short intent label","category":"billing|account|technical|shipping|other","urgency":"low"|"medium"|"high","intentConfidence":0.0-1.0,"response":"the draft the agent can edit and send","needsHumanReview":true}
Write the response as the agent. Use ONLY the policy passages provided. Quote or paraphrase them; do not invent refunds, SLAs, or account facts. If the passages do not cover the question, say you will check with a lead and ask one clarifying question. Set needsHumanReview true.`
            : `You are SupportPilot, a copilot for human support agents. You never send mail to the customer.
Return JSON only, no markdown, with this shape:
{"intent":"short intent label","category":"billing|account|technical|shipping|other","urgency":"low"|"medium"|"high","intentConfidence":0.0-1.0,"response":"${NO_POLICY_RESPONSE.replace(/"/g, '\\"')}","needsHumanReview":true}
Classify the ticket. The response MUST be exactly the provided refuse text. Do not invent company policy.`,
        },
        {
          role: "user",
          content: hasPolicy
            ? `${input.ticketContext}\n\nPolicy passages:\n${input.policyPassages}`
            : `${input.ticketContext}\n\nNO_POLICY_MATCHED`,
        },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new MiniMaxError(payload.error?.message ?? `MiniMax request failed (${response.status}).`);
  }

  const content = stripThinking(payload.choices?.[0]?.message?.content ?? "");
  const draft = draftSchema.parse(parseJsonObject(content));
  if (!hasPolicy) {
    return { ...draft, response: NO_POLICY_RESPONSE, needsHumanReview: true };
  }
  return { ...draft, needsHumanReview: true };
}

function stripThinking(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .trim();
}

function parseJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new MiniMaxError("MiniMax did not return JSON.");
  }
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}
