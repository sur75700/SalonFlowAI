export const supportedLanguages = ["en", "hy", "ru", "fr"] as const;

export type AppLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: AppLanguage = "en";

export const languageLabels: Record<AppLanguage, string> = {
  en: "English",
  hy: "Հայերեն",
  ru: "Русский",
  fr: "Français",
};\n