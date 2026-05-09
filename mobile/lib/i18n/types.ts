export const APP_LOCALES = ["en", "hy", "ru", "fr"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const APP_CURRENCIES = ["AMD", "USD", "EUR"] as const;
export type AppCurrency = (typeof APP_CURRENCIES)[number];
