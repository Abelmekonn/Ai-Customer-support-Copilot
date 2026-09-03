import { createAdminClient } from "@/lib/supabase/admin";
import type { IngestEmailJobPayload, Job, JobType, SendEmailJobPayload } from "@/lib/jobs/types";

export async function enqueueJob(input: {
  organizationId: string;
  type: JobType;
  payload: Record<string, unknown>;
  runAfter?: Date;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .insert({
      organization_id: input.organizationId,
      type: input.type,
      payload: input.payload,
      status: "pending",
      run_after: (input.runAfter ?? new Date()).toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not enqueue job.");
  }

  return data.id as string;
}

export async function enqueueIndexDocument(organizationId: string, documentId: string) {
  return enqueueJob({
    organizationId,
    type: "index_document",
    payload: { documentId },
  });
}

export async function enqueueIngestEmail(organizationId: string, payload: IngestEmailJobPayload) {
  return enqueueJob({
    organizationId,
    type: "ingest_email",
    payload,
  });
}

export async function enqueueSendEmail(organizationId: string, payload: SendEmailJobPayload) {
  return enqueueJob({
    organizationId,
    type: "send_email",
    payload: { messageId: payload.messageId },
  });
}

export async function completeJob(jobId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function failJob(jobId: string, message: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error: message,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function rescheduleJob(jobId: string, delayMs: number, message: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      status: "pending",
      run_after: new Date(Date.now() + delayMs).toISOString(),
      error: message,
      started_at: null,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function claimPendingJobs(batchSize = 3) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_pending_jobs", { batch_size: batchSize });
  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}

export async function claimPendingJobsForOrg(organizationId: string, batchSize = 3) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_pending_jobs_for_org", {
    target_organization_id: organizationId,
    batch_size: batchSize,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Job[];
}
