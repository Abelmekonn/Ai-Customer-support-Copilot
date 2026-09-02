import { SettingsForm } from "@/components/settings/settings-form";
import { getCurrentUser, getOrganization } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const organization = await getOrganization(user.organization_id);
  if (!organization) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="typo-heading-1">Settings</h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          Workspace identity. Model keys and retrieval settings come later.
        </p>
      </div>
      <SettingsForm user={user} organization={organization} />
    </div>
  );
}
