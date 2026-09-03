import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { canViewAnalytics } from "@/lib/auth/roles";
import { getAnalyticsSnapshot, getCurrentUser } from "@/lib/data";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!canViewAnalytics(user.role)) redirect("/dashboard");

  const data = await getAnalyticsSnapshot(user.organization_id);

  return <AnalyticsDashboard data={data} />;
}
