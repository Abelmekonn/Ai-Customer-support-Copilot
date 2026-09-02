"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data";
import { rotateWebhookSecret } from "@/lib/channels/email/account";

export async function rotateInboundSecretAction(
  _prev: { error?: string; success?: string },
  _formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();
  if (user.role !== "admin") {
    return { error: "Only admins can rotate the inbound secret." };
  }

  try {
    await rotateWebhookSecret(user.organization_id);
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "Could not rotate secret." };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Webhook secret rotated. Update the provider with the new value." };
}
