import { createAdminClient } from "@/lib/supabase/admin";

export type UsageType = "draft" | "embed_tokens" | "email_out" | "index_chunks";

export async function recordUsage(input: {
  organizationId: string;
  type: UsageType;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("usage_events").insert({
    organization_id: input.organizationId,
    type: input.type,
    quantity: input.quantity ?? 1,
    metadata: input.metadata ?? {},
  });
  if (error) {
    console.error("usage_events insert failed", error.message);
  }
}
