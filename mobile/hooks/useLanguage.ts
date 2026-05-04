import { useMemo, useState } from "react";

import { defaultLanguage, type AppLanguage } from "../lib/i18n";
import { translations } from "../translations";

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);

  const dictionary = useMemo(() => translations[language], [language]);

  return {
    language,
    setLanguage,
    dictionary,
  };
}
