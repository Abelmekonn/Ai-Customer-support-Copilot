export function isRateLimitError(message: string) {
  return /rate limit|rpm|too many requests|\b429\b|per-minute embedding limit/i.test(message);
}
