import { useState } from "react";

import { useToast } from "../components/ui/Toast";
import { useAppLanguage } from "../contexts/LanguageContext";
import { useSession } from "./useSession";

export function useLogout() {
  const { clearToken } = useSession();
  const { showToast } = useToast();
  const { t } = useAppLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setLoggingOut(true);
      clearToken();
      showToast(t.auth.signedOutSuccessfully, "success");
    } finally {
      setLoggingOut(false);
    }
  };

  return {
    logout,
    loggingOut,
  };
}
