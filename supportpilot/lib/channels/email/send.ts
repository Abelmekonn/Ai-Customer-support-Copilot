export type OutboundSendResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string; retryable?: boolean };

export function mapOutboundError(status: number, bodyText: string): OutboundSendResult {
  const lower = bodyText.toLowerCase();

  if (status === 401 || status === 403) {
    if (lower.includes("domain") || lower.includes("from") || lower.includes("verified")) {
      return {
        ok: false,
        error: "The From address isn’t verified in Resend. Verify the domain, then retry this reply.",
      };
    }
    return {
      ok: false,
      error: "Outbound email isn’t configured. Add a valid Resend API key on the server, then retry this reply.",
    };
  }

  if (status === 422 && (lower.includes("from") || lower.includes("domain") || lower.includes("invalid"))) {
    return {
      ok: false,
      error: "The From address isn’t accepted by Resend. Use a verified address, then retry this reply.",
    };
  }

  if (status === 429 || status >= 500) {
    return {
      ok: false,
      error: "The mail provider is busy. We’ll retry this reply shortly.",
      retryable: true,
    };
  }

  return {
    ok: false,
    error: "The reply could not be sent. Wait a moment and retry.",
  };
}

export type ProviderEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  headers: Record<string, string>;
  idempotencyKey: string;
};

export async function sendWithResend(
  input: ProviderEmail & { apiKey: string },
): Promise<OutboundSendResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.apiKey}`,
    "Content-Type": "application/json",
    "Idempotency-Key": input.idempotencyKey,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      reply_to: input.replyTo,
      subject: input.subject,
      text: input.text,
      headers: input.headers,
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    return mapOutboundError(response.status, bodyText);
  }

  let parsed: { id?: string } = {};
  try {
    parsed = JSON.parse(bodyText) as { id?: string };
  } catch {
    return { ok: false, error: "The mail provider returned an unexpected response. Retry this reply." };
  }

  if (!parsed.id) {
    return { ok: false, error: "The mail provider did not return a message id. Retry this reply." };
  }

  return { ok: true, providerId: parsed.id };
}
