import type {
  SettingsSectionGroup,
  SettingsSectionId,
} from "./contracts";

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  group: SettingsSectionGroup;
  searchAliases: readonly string[];
};

export const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  { id: "overview", group: "core", searchAliases: ["home", "summary", "command"] },
  { id: "account", group: "core", searchAliases: ["email", "profile", "role", "identity"] },
  { id: "workspace", group: "core", searchAliases: ["salon", "hours", "timezone", "capacity"] },
  { id: "appearance", group: "core", searchAliases: ["theme", "language", "locale", "cosmos"] },
  { id: "security", group: "protection", searchAliases: ["password", "verification", "2fa", "session", "գաղտնաբառ", "անվտանգություն", "пароль", "безопасность", "mot de passe", "sécurité"] },
  { id: "privacy", group: "protection", searchAliases: ["data", "export", "retention", "delete"] },
  { id: "team", group: "business", searchAliases: ["roles", "staff", "members", "invite"] },
  { id: "billing", group: "business", searchAliases: ["plan", "subscription", "stripe", "payment", "billing", "փաթեթ", "բաժանորդագրություն", "վճարում", "тариф", "подписка", "оплата", "facturation", "abonnement", "paiement"] },
  { id: "intelligence", group: "intelligence", searchAliases: ["ai", "insights", "decision", "forecast", "ինտելեկտ", "կանխատեսում", "интеллект", "прогноз", "intelligence", "prévision"] },
  { id: "governance", group: "intelligence", searchAliases: ["usage", "governance", "metering", "cost"] },
  { id: "notifications", group: "connections", searchAliases: ["email", "sms", "push", "whatsapp", "alerts"] },
  { id: "integrations", group: "connections", searchAliases: ["stripe", "calendar", "zapier", "make", "n8n", "webhook"] },
  { id: "status", group: "trust", searchAliases: ["health", "backend", "service", "operational"] },
  { id: "audit", group: "trust", searchAliases: ["activity", "history", "events", "audit"] },
  { id: "authority", group: "trust", searchAliases: ["ghoststage", "engineering", "product", "provenance"] },
  { id: "danger", group: "danger", searchAliases: ["sign out", "logout", "delete", "danger"] },
] as const;

export const SETTINGS_SECTION_IDS = SETTINGS_SECTIONS.map((section) => section.id);

export function isSettingsSectionId(value: unknown): value is SettingsSectionId {
  return typeof value === "string" && SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}
