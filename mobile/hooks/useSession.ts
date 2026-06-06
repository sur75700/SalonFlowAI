import { useEffect, useMemo, useState } from "react";

import {
  clearStoredToken,
  readStoredToken,
  writeStoredToken,
} from "../lib/api";
import { getTokenEmail } from "../lib/jwt";

const SESSION_EVENT = "salonflow-session-changed";

let memoryToken = "";
const listeners = new Set<(token: string) => void>();

function canUseBrowserSessionEvents(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function" &&
    typeof window.removeEventListener === "function" &&
    typeof window.dispatchEvent === "function" &&
    typeof Event === "function"
  );
}

function getCurrentToken(): string {
  return memoryToken || readStoredToken();
}

function notifySessionChanged(nextToken: string) {
  memoryToken = nextToken;

  listeners.forEach((listener) => {
    listener(nextToken);
  });

  if (canUseBrowserSessionEvents()) {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function useSession() {
  const [token, setTokenState] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = getCurrentToken();
      setTokenState(stored);
      setBooting(false);
    };

    const syncFromMemory = (nextToken: string) => {
      setTokenState(nextToken);
      setBooting(false);
    };

    listeners.add(syncFromMemory);
    syncFromStorage();

    if (canUseBrowserSessionEvents()) {
      window.addEventListener(SESSION_EVENT, syncFromStorage);
      window.addEventListener("storage", syncFromStorage);

      return () => {
        listeners.delete(syncFromMemory);
        window.removeEventListener(SESSION_EVENT, syncFromStorage);
        window.removeEventListener("storage", syncFromStorage);
      };
    }

    return () => {
      listeners.delete(syncFromMemory);
    };
  }, []);

  const setToken = (nextToken: string) => {
    writeStoredToken(nextToken);
    notifySessionChanged(nextToken);
  };

  const clearToken = () => {
    clearStoredToken();
    notifySessionChanged("");
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
