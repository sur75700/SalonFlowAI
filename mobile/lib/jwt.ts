export function parseJwtPayload(token?: string): Record<string, any> | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      payload + "=".repeat((4 - (payload.length % 4)) % 4);

    if (typeof atob === "function") {
      const decoded = atob(padded);
      return JSON.parse(decoded);
    }

    return null;
  } catch {
    return null;
  }
}

export function getTokenEmail(token?: string): string {
  const payload = parseJwtPayload(token);
  return (
    payload?.email ||
    payload?.sub ||
    payload?.username ||
    ""
  );
}
