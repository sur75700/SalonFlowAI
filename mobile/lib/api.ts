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

export type BillingStatus = {
  plan: "free" | "pro" | "business" | "enterprise";
  status: string;
  provider: string;
  features: string[];
  expires_at?: string | null;
  source?: string;
  billing_ready: boolean;
  updated_at?: string;
};

export type CurrentUser = {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  email_verified?: boolean;
  last_login_at?: string;
  created_at?: string;
};

export type CheckoutSessionResponse = {
  session_id: string;
  checkout_url: string;
  plan: BillingStatus["plan"];
};

export type CustomerPortalResponse = {
  portal_url: string;
  customer_id: string;
};

export async function fetchBillingStatus(token: string): Promise<BillingStatus> {
  const response = await api.get("/billing/status", {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function setBillingPlan(
  token: string,
  plan: BillingStatus["plan"]
): Promise<BillingStatus> {
  const response = await api.post(
    "/billing/admin/set-plan",
    { plan },
    {
      headers: authHeaders(token),
    }
  );

  return response.data;
}

export async function createCheckoutSession(
  token: string,
  plan: BillingStatus["plan"],
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResponse> {
  const response = await api.post(
    "/billing/create-checkout-session",
    {
      plan,
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    {
      headers: authHeaders(token),
    }
  );

  return response.data;
}

export async function createCustomerPortalSession(
  token: string,
  returnUrl: string
): Promise<CustomerPortalResponse> {
  const response = await api.post(
    "/billing/customer-portal",
    {
      return_url: returnUrl,
    },
    {
      headers: authHeaders(token),
    }
  );

  return response.data;
}

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

export async function registerAccount(
  fullName: string,
  email: string,
  password: string
): Promise<void> {
  await api.post("/auth/register", {
    full_name: fullName,
    email,
    password,
  });
}


export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string }> {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  const response = await api.post("/auth/reset-password", {
    token,
    new_password: newPassword,
  });

  return response.data;
}


export async function appleLogin(
  identityToken: string,
  fullName?: string | null
): Promise<string> {
  const response = await api.post("/auth/apple", {
    identity_token: identityToken,
    full_name: fullName || null,
  });

  const token = response?.data?.access_token;

  if (!token) {
    throw new Error("No access token returned");
  }

  getBrowserStorage()?.setItem(STORAGE_KEYS.token, token);

  return token;
}

export async function googleLogin(
  idToken: string
): Promise<string> {
  const response = await api.post("/auth/google", {
    id_token: idToken,
  });

  const token = response?.data?.access_token;

  if (!token) {
    throw new Error("No access token returned");
  }

  getBrowserStorage()?.setItem(STORAGE_KEYS.token, token);

  return token;
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
