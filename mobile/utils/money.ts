import type { AppCurrency, AppLocale } from "../lib/i18n/types";

export function formatMoney(
  value: number | null | undefined,
  currency: AppCurrency = "AMD",
  locale: string = "en"
): string {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "AMD" ? 0 : 2,
    }).format(safeValue);
  } catch {
    return `${safeValue} ${currency}`;
  }
}

export function money(
  value: number | null | undefined,
  currency: AppCurrency = "AMD",
  locale: AppLocale = "en"
): string {
  return formatMoney(value, currency, locale);
}
