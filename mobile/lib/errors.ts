export function getErrorMessage(
  err: any,
  fallback: string = "Something went wrong"
): string {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    fallback
  );
}
