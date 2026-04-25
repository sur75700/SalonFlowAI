export const money = (
  value?: number | null,
  currency: string = "AMD"
): string => {
  const safe = Number(value || 0);
  return `${safe.toLocaleString()} ${currency}`;
};

export const formatDateTime = (isoString?: string | null): string => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString();
};

export const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayDateInput = (): string => {
  return formatDateInput(new Date());
};

export const yesterdayDateInput = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateInput(d);
};

export const formatDateTimeLocalInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const nextHourDateTimeInput = (): string => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return formatDateTimeLocalInput(d);
};

export const tomorrowMorningDateTimeInput = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return formatDateTimeLocalInput(d);
};

export const todayEveningDateTimeInput = (): string => {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return formatDateTimeLocalInput(d);
};

export const toIsoFromLocalInput = (value: string): string => {
  return new Date(value).toISOString();
};

export const shortDay = (dateString?: string | null): string => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

export const isToday = (isoString?: string | null): boolean => {
  if (!isoString) return false;

  const d = new Date(isoString);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const isFuture = (isoString?: string | null): boolean => {
  if (!isoString) return false;
  return new Date(isoString).getTime() > Date.now();
};
