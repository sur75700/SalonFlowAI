export type AppLanguage = "en" | "hy" | "ru" | "fr";
export type Locale = AppLanguage;

export const defaultLanguage: AppLanguage = "en";
export const defaultLocale: Locale = "en";

export const supportedLanguages: AppLanguage[] = ["en", "hy", "ru", "fr"];

export const languageLabels: Record<AppLanguage, string> = {
  en: "English",
  hy: "Հայերեն",
  ru: "Русский",
  fr: "Français",
};

export function t(key: string, locale: AppLanguage | string = defaultLanguage): string {
  return key;
}
