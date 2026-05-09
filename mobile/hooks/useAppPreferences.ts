import { APP_PREFERENCES } from "../lib/config/appPreferences";

export function useAppPreferences() {
  return {
    locale: APP_PREFERENCES.defaultLocale,
    currency: APP_PREFERENCES.defaultCurrency,
    supportedLocales: APP_PREFERENCES.supportedLocales,
    supportedCurrencies: APP_PREFERENCES.supportedCurrencies,
  };
}
