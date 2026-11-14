/** Responsibility: validate and normalize user-supplied URLs before they are stored or linked. */
export function sanitizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch { return null; }
}
