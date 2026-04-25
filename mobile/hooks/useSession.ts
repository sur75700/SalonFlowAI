import { useEffect, useMemo, useState } from "react";

import {
  clearStoredToken,
  readStoredToken,
  writeStoredToken,
} from "../lib/api";
import { getTokenEmail } from "../lib/jwt";

const SESSION_EVENT = "salonflow-session-changed";

function emitSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function useSession() {
  const [token, setTokenState] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = readStoredToken();
      setTokenState(stored);
      setBooting(false);
    };

    syncFromStorage();

    if (typeof window !== "undefined") {
      window.addEventListener(SESSION_EVENT, syncFromStorage);
      window.addEventListener("storage", syncFromStorage);

      return () => {
        window.removeEventListener(SESSION_EVENT, syncFromStorage);
        window.removeEventListener("storage", syncFromStorage);
      };
    }

    return;
  }, []);

  const setToken = (nextToken: string) => {
    writeStoredToken(nextToken);
    setTokenState(nextToken);
    emitSessionChanged();
  };

  const clearToken = () => {
    clearStoredToken();
    setTokenState("");
    emitSessionChanged();
  };

  const sessionEmail = useMemo(() => getTokenEmail(token), [token]);

  return {
    token,
    setToken,
    clearToken,
    booting,
    sessionEmail,
  };
}
