export function threadLookupIds(input: {
  inReplyTo: string | null;
  references: string[];
}) {
  return [...new Set([input.inReplyTo, ...input.references].filter((id): id is string => Boolean(id)))];
}

export function sanitizeAttachmentName(fileName: string) {
  const base = fileName.split(/[/\\]/).pop()?.trim() || "attachment";
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 180) || "attachment";
}
