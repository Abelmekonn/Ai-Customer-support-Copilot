export type JobType = "index_document" | "ingest_email" | "send_email";
export type JobStatus = "pending" | "running" | "succeeded" | "failed";

export type Job = {
  id: string;
  organization_id: string;
  type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error: string | null;
  run_after: string;
  started_at: string | null;
  completed_at: string | null;
};

export type IndexDocumentPayload = {
  documentId: string;
};

export type SendEmailJobPayload = {
  messageId: string;
};

export type IngestEmailJobPayload = {
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  attachments: {
    filename: string;
    contentType: string;
    filePath: string;
  }[];
};
