import { timingSafeEqual } from "node:crypto";

export function cronSecret() {
  return process.env.CRON_SECRET?.trim() || "";
}

export function authorizeCronRequest(request: Request) {
  const secret = cronSecret();
  if (!secret) return false;
  const bearer = request.headers.get("authorization");
  const token = bearer?.toLowerCase().startsWith("bearer ")
    ? bearer.slice(7).trim()
    : request.headers.get("x-cron-secret")?.trim() || "";
  return secretsEqual(token, secret);
}

function secretsEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
