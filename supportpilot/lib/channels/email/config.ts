export function outboundConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RESEND_FROM?.trim() ?? "";
  return {
    apiKey,
    from,
    configured: Boolean(apiKey && from),
  };
}

export function outboundFromLabel() {
  return process.env.RESEND_FROM?.trim() || null;
}
