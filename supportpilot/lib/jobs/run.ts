import { ingestInboundEmail, type IngestEmailPayload } from "@/lib/channels/email/ingest";
import { deliverOutboundMessage, markOutboundFailed } from "@/lib/channels/email/outbound";
import { markDocumentFailed, processKnowledgeDocument } from "@/lib/knowledge/process";
import { claimPendingJobs, completeJob, failJob, rescheduleJob } from "@/lib/jobs/queue";
import { RATE_LIMIT_DELAY_MS, resolveIndexJobAction, resolveSendJobAction } from "@/lib/jobs/policy";
import type { Job } from "@/lib/jobs/types";

export async function runPendingJobs(batchSize = 3) {
  const jobs = await claimPendingJobs(batchSize);
  for (const job of jobs) {
    await runJob(job);
  }
  return jobs.length;
}

async function runJob(job: Job) {
  try {
    if (job.type === "index_document") {
      const documentId = String(job.payload.documentId ?? "");
      if (!documentId) {
        await failJob(job.id, "index_document missing documentId.");
        return;
      }

      const result = await processKnowledgeDocument(documentId);
      const action = resolveIndexJobAction({
        documentId,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        result,
      });

      if (action.type === "fail-job") {
        await failJob(job.id, action.error);
        return;
      }
      if (action.type === "complete") {
        await completeJob(job.id);
        return;
      }
      if (action.type === "reschedule") {
        await rescheduleJob(job.id, action.delayMs, action.error);
        return;
      }

      await markDocumentFailed(documentId, action.error);
      await failJob(job.id, action.error);
      return;
    }

    if (job.type === "ingest_email") {
      const payload = job.payload as unknown as IngestEmailPayload;
      if (!payload.messageId || !payload.fromEmail) {
        await failJob(job.id, "ingest_email missing messageId or fromEmail.");
        return;
      }
      await ingestInboundEmail(job.organization_id, payload);
      await completeJob(job.id);
      return;
    }

    if (job.type === "send_email") {
      const messageId = String(job.payload.messageId ?? "");
      if (!messageId) {
        await failJob(job.id, "send_email missing messageId.");
        return;
      }

      const result = await deliverOutboundMessage(job.organization_id, messageId);
      const action = resolveSendJobAction({
        messageId,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        result,
      });

      if (action.type === "fail-job") {
        await failJob(job.id, action.error);
        return;
      }
      if (action.type === "complete") {
        await completeJob(job.id);
        return;
      }
      if (action.type === "reschedule") {
        await rescheduleJob(job.id, action.delayMs, action.error);
        return;
      }

      await markOutboundFailed(messageId, job.organization_id, action.error);
      await failJob(job.id, action.error);
      return;
    }

    await failJob(job.id, `Unknown job type: ${job.type}`);
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Job failed.";
    const documentId =
      job.type === "index_document" ? String(job.payload.documentId ?? "") : "";
    const outboundMessageId =
      job.type === "send_email" ? String(job.payload.messageId ?? "") : "";
    if (job.attempts < job.max_attempts) {
      await rescheduleJob(job.id, RATE_LIMIT_DELAY_MS, message);
      return;
    }
    if (documentId) await markDocumentFailed(documentId, message);
    if (outboundMessageId) await markOutboundFailed(outboundMessageId, job.organization_id, message);
    await failJob(job.id, message);
  }
}
