import axios from "axios";

function normalizeDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const loc = Array.isArray(obj.loc) ? obj.loc.join(".") : "";
          const msg =
            typeof obj.msg === "string" ? obj.msg : JSON.stringify(obj);

          return loc ? `${loc}: ${msg}` : msg;
        }

        return String(item);
      })
      .join(" | ");
  }

  if (detail && typeof detail === "object") {
    const obj = detail as Record<string, unknown>;
    if (typeof obj.msg === "string") return obj.msg;
    return JSON.stringify(obj);
  }

  return "Unknown error";
}

export function getErrorMessage(
  error: unknown,
  fallback = "Request failed"
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;

    if (typeof data === "string") return data;
    if (data?.detail !== undefined) return normalizeDetail(data.detail);
    if (data?.message !== undefined) return normalizeDetail(data.message);

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error;

  return fallback;
}

