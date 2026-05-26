import { useAppLanguage } from "../contexts/LanguageContext";
import { APP_PREFERENCES } from "../lib/config/appPreferences";

export function useAppPreferences() {
  const { language } = useAppLanguage();

  return {
    locale: language,
    currency: APP_PREFERENCES.defaultCurrency,
    supportedLocales: APP_PREFERENCES.supportedLocales,
    supportedCurrencies: APP_PREFERENCES.supportedCurrencies,
  };
}
