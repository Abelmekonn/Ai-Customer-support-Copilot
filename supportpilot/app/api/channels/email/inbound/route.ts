import { acceptInboundEmail } from "@/lib/channels/email/inbound";

export const maxDuration = 60;

export async function POST(request: Request) {
  return acceptInboundEmail(request);
}
