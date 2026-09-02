import { NextResponse } from "next/server";
import { getCurrentUser, listTickets } from "@/lib/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const tickets = await listTickets(user.organization_id, status);
  return NextResponse.json({ tickets });
}
