import { useState } from "react";

import { useToast } from "../components/ui/Toast";
import { useSession } from "./useSession";

export function useLogout() {
  const { clearToken } = useSession();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setLoggingOut(true);
      clearToken();
      showToast("Signed out successfully", "success");
    } finally {
      setLoggingOut(false);
    }
  };

  return {
    logout,
    loggingOut,
  };
}
