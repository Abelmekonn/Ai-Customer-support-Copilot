import { createHmac, timingSafeEqual } from "node:crypto";

export function secretsMatch(provided: string | null | undefined, expected: string) {
  if (!provided || !expected) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifySvixSignature(input: {
  secret: string;
  rawBody: string;
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  toleranceSeconds?: number;
}) {
  const { secret, rawBody, id, timestamp, signatureHeader } = input;
  if (!id || !timestamp || !signatureHeader) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > (input.toleranceSeconds ?? 300)) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  const candidates = signatureHeader.split(" ").flatMap((part) => {
    const value = part.includes(",") ? part.slice(part.indexOf(",") + 1) : part;
    return value ? [value] : [];
  });

  return candidates.some((candidate) => secretsMatch(candidate, expected));
}

export function verifyInboundRequest(input: {
  rawBody: string;
  headers: Headers;
  channelSecret: string;
  platformSecret?: string;
}) {
  const shared =
    input.headers.get("x-inbound-secret") ??
    input.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (secretsMatch(shared, input.channelSecret)) return true;
  if (input.platformSecret && secretsMatch(shared, input.platformSecret)) return true;

  const svixSecret = input.platformSecret?.startsWith("whsec_")
    ? input.platformSecret
    : input.channelSecret.startsWith("whsec_")
      ? input.channelSecret
      : null;

  if (!svixSecret) return false;

  return verifySvixSignature({
    secret: svixSecret,
    rawBody: input.rawBody,
    id: input.headers.get("svix-id"),
    timestamp: input.headers.get("svix-timestamp"),
    signatureHeader: input.headers.get("svix-signature"),
  });
}
