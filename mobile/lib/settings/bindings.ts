import { api, authHeaders } from "../api";
import type {
  BackendHealth,
  BillingPlan,
  BillingPlansResponse,
  CapacityBusinessDay,
  CapacityConfiguration,
  CapacityConfigurationResponse,
} from "./contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${field} must be a boolean`);
  }
  return value;
}

function parseBusinessDays(value: unknown): CapacityBusinessDay[] {
  if (!Array.isArray(value)) throw new TypeError("weekly_business_hours must be an array");
  return value.map((day, dayIndex) => {
    if (!isRecord(day)) throw new TypeError(`weekly_business_hours[${dayIndex}] must be an object`);
    const weekday = requireNumber(day.weekday, `weekly_business_hours[${dayIndex}].weekday`);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      throw new TypeError(`weekly_business_hours[${dayIndex}].weekday is invalid`);
    }
    if (!Array.isArray(day.intervals)) {
      throw new TypeError(`weekly_business_hours[${dayIndex}].intervals must be an array`);
    }
    const intervals = day.intervals.map((interval, intervalIndex) => {
      if (!isRecord(interval)) {
        throw new TypeError(`weekly_business_hours[${dayIndex}].intervals[${intervalIndex}] must be an object`);
      }
      const start = requireNumber(interval.start_minute, "start_minute");
      const end = requireNumber(interval.end_minute, "end_minute");
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 1440 || end <= start) {
        throw new TypeError("capacity interval is invalid");
      }
      return { start_minute: start, end_minute: end };
    });
    return { weekday, intervals };
  });
}

export function parseCapacityConfigurationResponse(value: unknown): CapacityConfigurationResponse {
  if (!isRecord(value)) throw new TypeError("capacity response must be an object");
  if (value.configuration === null) return { configuration: null };
  if (!isRecord(value.configuration)) throw new TypeError("capacity configuration must be an object or null");
  const raw = value.configuration;
  const status = requireString(raw.status, "status");
  if (status !== "draft" && status !== "active") throw new TypeError("capacity status is invalid");
  const configuration: CapacityConfiguration = {
    id: requireString(raw.id, "id"),
    schema_version: requireNumber(raw.schema_version, "schema_version"),
    revision: requireNumber(raw.revision, "revision"),
    status,
    timezone: requireString(raw.timezone, "timezone"),
    slot_duration_minutes: requireNumber(raw.slot_duration_minutes, "slot_duration_minutes"),
    weekly_business_hours: parseBusinessDays(raw.weekly_business_hours),
    created_at: requireString(raw.created_at, "created_at"),
    updated_at: requireString(raw.updated_at, "updated_at"),
  };
  return { configuration };
}

export function parseBillingPlansResponse(value: unknown): BillingPlansResponse {
  if (!isRecord(value) || !Array.isArray(value.plans)) throw new TypeError("billing plans response is invalid");
  const plans: BillingPlan[] = value.plans.map((plan, index) => {
    if (!isRecord(plan)) throw new TypeError(`plans[${index}] must be an object`);
    const code = requireString(plan.code, `plans[${index}].code`);
    if (!["free", "pro", "business", "enterprise"].includes(code)) {
      throw new TypeError(`plans[${index}].code is invalid`);
    }
    const rawPrice = plan.monthly_price;
    const monthlyPrice = rawPrice === null ? null : requireNumber(rawPrice, `plans[${index}].monthly_price`);
    if (!Array.isArray(plan.features) || !plan.features.every((item) => typeof item === "string")) {
      throw new TypeError(`plans[${index}].features is invalid`);
    }
    return {
      code: code as BillingPlan["code"],
      name: requireString(plan.name, `plans[${index}].name`),
      monthly_price: monthlyPrice,
      currency: requireString(plan.currency, `plans[${index}].currency`),
      highlighted: requireBoolean(plan.highlighted, `plans[${index}].highlighted`),
      features: [...plan.features],
    };
  });
  return {
    plans,
    provider: requireString(value.provider, "provider"),
    billing_ready: requireBoolean(value.billing_ready, "billing_ready"),
  };
}

export async function fetchSettingsCapacityConfiguration(token: string): Promise<CapacityConfigurationResponse> {
  const response = await api.get("/capacity/configuration", { headers: authHeaders(token) });
  return parseCapacityConfigurationResponse(response.data);
}

export async function fetchSettingsBillingPlans(): Promise<BillingPlansResponse> {
  const response = await api.get("/billing/plans");
  return parseBillingPlansResponse(response.data);
}

export async function fetchSettingsBackendHealth(): Promise<BackendHealth> {
  const response = await api.get("/healthz");
  if (!isRecord(response.data) || response.data.status !== "ok") {
    throw new TypeError("health response is invalid");
  }
  return { status: "ok" };
}
