import { createAdminClient } from "@/lib/supabase/admin";
import type { StoredInboundAttachment } from "@/lib/channels/email/parse";
import { sanitizeAttachmentName } from "@/lib/channels/email/thread";
import type { StoredAttachmentRef } from "@/lib/channels/email/ingest";

const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export async function storeInboundAttachments(input: {
  organizationId: string;
  messageId: string;
  attachments: StoredInboundAttachment[];
}): Promise<StoredAttachmentRef[]> {
  const admin = createAdminClient();
  const stored: StoredAttachmentRef[] = [];

  for (const attachment of input.attachments.slice(0, MAX_ATTACHMENTS)) {
    let bytes: Buffer;
    try {
      bytes = Buffer.from(attachment.contentBase64, "base64");
    } catch {
      continue;
    }
    if (!bytes.length || bytes.byteLength > MAX_ATTACHMENT_BYTES) continue;

    const filename = sanitizeAttachmentName(attachment.filename);
    const safeMessageId = sanitizeAttachmentName(input.messageId);
    const filePath = `${input.organizationId}/inbound/${safeMessageId}/${filename}`;
    const { error } = await admin.storage.from("ticket-attachments").upload(filePath, bytes, {
      contentType: attachment.contentType,
      upsert: false,
    });

    if (error && !/already exists|duplicate/i.test(error.message)) {
      throw new Error(error.message);
    }

    stored.push({
      filename,
      contentType: attachment.contentType,
      filePath,
    });
  }

  return stored;
}
