import Link from "next/link";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { BrandMark } from "@/components/brand/brand-mark";
import { getPublicInvite } from "@/lib/team/invites";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getPublicInvite(token);

  return (
    <div className="w-full max-w-md space-y-6">
      <BrandMark inverted />
      {!invite ? (
        <div className="space-y-3">
          <h1 className="typo-heading-1">Invite unavailable</h1>
          <p className="typo-subtitle text-ink-tint">
            This invite is invalid or has expired. Ask an admin to send a new one.
          </p>
          <Link href="/login" className="text-[14px] font-medium text-primary">
            Sign in
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h1 className="typo-heading-1">Join {invite.organizationName}</h1>
            <p className="typo-subtitle mt-2 text-ink-tint">
              You’ll join as {invite.role}. The copilot drafts; you send.
            </p>
          </div>
          <AcceptInviteForm token={token} invite={invite} />
        </div>
      )}
    </div>
  );
}
