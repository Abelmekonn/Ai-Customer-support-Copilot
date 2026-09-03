import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/jobs/auth";
import { runPendingJobs } from "@/lib/jobs/run";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

async function drain(request: Request, allowSession: boolean) {
  if (authorizeCronRequest(request)) {
    const ran = await runPendingJobs();
    return NextResponse.json({ ok: true, ran, scope: "all" });
  }

  if (!allowSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ran = await runPendingJobs({ organizationId: profile.organization_id });
  return NextResponse.json({ ok: true, ran, scope: "organization" });
}

export async function GET(request: Request) {
  return drain(request, false);
}

export async function POST(request: Request) {
  return drain(request, true);
}
