export type StoredInboundAttachment = {
  filename: string;
  contentType: string;
  contentBase64: string;
};

export type InboundEmail = {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  text: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  attachments: StoredInboundAttachment[];
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function extractEmailAddress(value: string) {
  const angled = value.match(/<([^>]+)>/);
  return normalizeEmail(angled?.[1] ?? value);
}

export function extractDisplayName(value: string) {
  const match = value.match(/^(.*)<[^>]+>\s*$/);
  return match?.[1]?.replace(/^["'\s]+|["'\s]+$/g, "").trim() ?? "";
}

export function stripReplyPrefix(subject: string) {
  let next = subject.trim();
  let previous = "";
  while (next !== previous) {
    previous = next;
    next = next.replace(/^(re|fw|fwd)\s*:\s*/i, "").trim();
  }
  return next || subject.trim();
}

function headerValue(headers: unknown, name: string) {
  if (!Array.isArray(headers)) return null;
  const match = headers.find((header) => {
    if (!header || typeof header !== "object") return false;
    const record = header as Record<string, unknown>;
    const key = String(record.Name ?? record.name ?? "");
    return key.toLowerCase() === name.toLowerCase();
  }) as Record<string, unknown> | undefined;
  const value = match?.Value ?? match?.value;
  return typeof value === "string" ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAttachments(value: unknown): StoredInboundAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];
    const filename = firstString(record.Name, record.filename, record.fileName) || "attachment";
    const content = firstString(record.Content, record.content, record.contentBase64);
    if (!content) return [];
    return [
      {
        filename,
        contentType: firstString(record.ContentType, record.contentType, record.type) || "application/octet-stream",
        contentBase64: content,
      },
    ];
  });
}

export function peekToAddress(body: unknown): string | null {
  const root = asRecord(body);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  const to =
    firstString(data.to, root.To) ||
    (Array.isArray(data.to) ? firstString(data.to[0]) : "") ||
    (Array.isArray(root.ToFull) ? firstString(asRecord(root.ToFull[0])?.Email) : "");
  return to ? extractEmailAddress(to) : null;
}

export function parseInboundPayload(body: unknown): InboundEmail {
  const root = asRecord(body);
  if (!root) throw new Error("Inbound payload must be JSON.");

  const data = asRecord(root.data) ?? root;
  const fromFull = asRecord(root.FromFull) ?? asRecord(data.from);
  const toFull = Array.isArray(root.ToFull) ? asRecord(root.ToFull[0]) : null;

  const fromRaw = firstString(fromFull?.email, fromFull?.Email, data.from, root.From, root.from);
  const fromEmail = extractEmailAddress(fromRaw);
  const toEmail = extractEmailAddress(
    firstString(
      toFull?.Email,
      Array.isArray(data.to) ? data.to[0] : data.to,
      root.To,
      root.to,
    ),
  );
  const subject = firstString(data.subject, root.Subject, root.subject) || "(no subject)";
  const html = firstString(data.html, root.HtmlBody, root.html);
  const text =
    firstString(data.text, root.TextBody, root.text, root.body) ||
    (html ? htmlToText(html) : "") ||
    "(no text body)";
  const messageId = firstString(
    data.message_id,
    data.email_id,
    root.MessageID,
    root.messageId,
    headerValue(root.Headers, "Message-ID"),
  );
  const inReplyTo =
    firstString(data.in_reply_to, root.inReplyTo, headerValue(root.Headers, "In-Reply-To")) || null;
  const referencesRaw = firstString(data.references, headerValue(root.Headers, "References"));

  if (!fromEmail || !fromEmail.includes("@")) {
    throw new Error("Inbound email is missing a From address.");
  }
  if (!toEmail || !toEmail.includes("@")) {
    throw new Error("Inbound email is missing a To address.");
  }
  if (!messageId) {
    throw new Error("Inbound email is missing a Message-ID.");
  }

  return {
    fromEmail,
    fromName:
      firstString(fromFull?.name, fromFull?.Name, root.FromName, extractDisplayName(fromRaw)) ||
      fromEmail.split("@")[0] ||
      "Customer",
    toEmail,
    subject,
    text,
    messageId: messageId.replace(/^<|>$/g, ""),
    inReplyTo: inReplyTo ? inReplyTo.replace(/^<|>$/g, "") : null,
    references: referencesRaw
      ? referencesRaw.split(/\s+/).map((value) => value.replace(/^<|>$/g, "")).filter(Boolean)
      : [],
    attachments: parseAttachments(data.attachments ?? root.Attachments),
  };
}
