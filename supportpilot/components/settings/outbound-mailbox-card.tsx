export function OutboundMailboxCard({
  configured,
  fromAddress,
  replyTo,
}: {
  configured: boolean;
  fromAddress: string | null;
  replyTo: string;
}) {
  return (
    <section className="max-w-lg space-y-3 rounded-xl border border-white/10 p-5">
      <div>
        <h2 className="text-[16px] font-medium">Outbound email</h2>
        <p className="mt-1 text-[14px] leading-6 text-steel">
          Send on a ticket goes out through Resend, with Reply-To set to your inbound address so customers stay on the
          same thread. The copilot never sends on its own.
        </p>
      </div>
      {configured && fromAddress ? (
        <p className="text-[14px]">
          From <span className="font-mono text-[13px]">{fromAddress}</span>
        </p>
      ) : (
        <p className="text-[14px] text-steel">
          Outbound isn’t configured yet. Add <span className="font-mono">RESEND_API_KEY</span> and{" "}
          <span className="font-mono">RESEND_FROM</span> on the server, then retry a reply.
        </p>
      )}
      <p className="text-[13px] text-steel">
        Reply-To: <span className="font-mono">{replyTo}</span>
      </p>
    </section>
  );
}
