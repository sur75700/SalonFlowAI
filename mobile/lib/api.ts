import axios from "axios";

import { DEFAULTS, STORAGE_KEYS } from "./appConfig";
import { getApiBaseUrl } from "./env";

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(): BrowserStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage ?? null;
}

export function authHeaders(token?: string) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export type CurrentUser = {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  email_verified?: boolean;
  last_login_at?: string;
  created_at?: string;
};

export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  const response = await api.get("/auth/me", {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  const response = await api.post(
    "/auth/change-password",
    {
      current_password: currentPassword,
      new_password: newPassword,
    },
    {
      headers: authHeaders(token),
    }
  );

  return response.data;
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

  getBrowserStorage()?.setItem(STORAGE_KEYS.token, token);

  return token;
}

export function readStoredToken(): string {
  return getBrowserStorage()?.getItem(STORAGE_KEYS.token) || "";
}

export function writeStoredToken(token: string) {
  getBrowserStorage()?.setItem(STORAGE_KEYS.token, token);
}

export function clearStoredToken() {
  getBrowserStorage()?.removeItem(STORAGE_KEYS.token);
}
