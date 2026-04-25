import axios from "axios";

import { DEFAULTS, STORAGE_KEYS } from "./appConfig";
import { getApiBaseUrl } from "./env";

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function authHeaders(token?: string) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export function isAuthError(err: any): boolean {
  const status = err?.response?.status;
  return status === 401 || status === 403;
}

export async function saveTokenFromCredentials(
  email: string = DEFAULTS.adminEmail,
  password: string = DEFAULTS.adminPassword
): Promise<string> {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const token = response?.data?.access_token;

  if (!token) {
    throw new Error("No access token returned");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEYS.token, token);
  }

  return token;
}

export function readStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEYS.token) || "";
}

export function writeStoredToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.token, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.token);
}
