import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser, getDashboardStats } from "@/lib/data";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getDashboardStats(user.organization_id);
  const total = stats.openTickets + stats.pendingTickets + stats.resolvedTickets;
  const assistedRate = total === 0 ? 0 : Math.round((stats.aiAssisted / total) * 100);

  return (
    <div className="h-full min-h-0 w-full space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="typo-heading-1">Analytics</h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          Queue volume and copilot coverage. Retrieval quality metrics arrive with evaluation.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Open" value={stats.openTickets} />
        <Metric label="Pending" value={stats.pendingTickets} />
        <Metric label="Resolved" value={stats.resolvedTickets} />
        <Metric label="AI drafts" value={stats.aiAssisted} />
        <Metric label="Assisted rate" value={`${assistedRate}%`} />
        <Metric label="Indexed docs" value={stats.documents} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader>
        <p className="typo-eyebrow text-steel">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="typo-stat">{value}</p>
      </CardContent>
    </Card>
  );
}
