import type { AppCurrency, AppLocale } from "../i18n/types";

export const APP_PREFERENCES = {
  defaultLocale: "en" as AppLocale,
  defaultCurrency: "AMD" as AppCurrency,
  supportedLocales: ["en", "hy", "ru", "fr"] as AppLocale[],
  supportedCurrencies: ["AMD", "USD", "EUR"] as AppCurrency[],
} as const;
