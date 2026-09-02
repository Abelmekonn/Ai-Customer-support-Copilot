import { after } from "next/server";
import { NextResponse } from "next/server";
import { getChannelAccountByAddress } from "@/lib/channels/email/account";
import { parseInboundPayload, peekToAddress } from "@/lib/channels/email/parse";
import { storeInboundAttachments } from "@/lib/channels/email/store";
import { verifyInboundRequest } from "@/lib/channels/email/verify";
import { enqueueIngestEmail } from "@/lib/jobs/queue";
import { runPendingJobs } from "@/lib/jobs/run";

export async function acceptInboundEmail(request: Request) {
  const rawBody = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Inbound payload must be JSON." }, { status: 400 });
  }

  const toEmail = peekToAddress(body);
  if (!toEmail) {
    return NextResponse.json({ error: "Inbound email is missing a To address." }, { status: 400 });
  }

  const channel = await getChannelAccountByAddress(toEmail);
  if (!channel) {
    return NextResponse.json({ error: "Unknown inbound address." }, { status: 404 });
  }

  const verified = verifyInboundRequest({
    rawBody,
    headers: request.headers,
    channelSecret: channel.webhook_secret,
    platformSecret: process.env.INBOUND_WEBHOOK_SECRET,
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid inbound signature." }, { status: 401 });
  }

  let parsed;
  try {
    parsed = parseInboundPayload(body);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not parse inbound email.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const attachments = await storeInboundAttachments({
    organizationId: channel.organization_id,
    messageId: parsed.messageId,
    attachments: parsed.attachments,
  });

  await enqueueIngestEmail(channel.organization_id, {
    fromEmail: parsed.fromEmail,
    fromName: parsed.fromName,
    subject: parsed.subject,
    text: parsed.text,
    messageId: parsed.messageId,
    inReplyTo: parsed.inReplyTo,
    references: parsed.references,
    attachments,
  });

  after(() => {
    void runPendingJobs();
  });

  return NextResponse.json({ ok: true, queued: true }, { status: 202 });
}
