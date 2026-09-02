import { NextResponse } from "next/server";
import { runPendingJobs } from "@/lib/jobs/run";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ran = await runPendingJobs();
  return NextResponse.json({ ok: true, ran });
}
