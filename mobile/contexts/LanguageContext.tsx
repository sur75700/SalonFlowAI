import React, { createContext, useContext, useMemo, useState } from "react";

import { defaultLanguage, type AppLanguage } from "../lib/i18n";
import { translations } from "../translations";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: typeof translations.en;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useAppLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
