/**
 * Validate that a URL uses http or https protocol.
 * Prevents javascript:, data:, vbscript: open redirect attacks from scraped data.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
