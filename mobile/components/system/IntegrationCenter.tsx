import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type IntegrationItem = {
  labelKey: string;
  valueKey: string;
};

const INTEGRATION_ITEMS: IntegrationItem[] = [
  { labelKey: "Google Calendar Integration", valueKey: "Integration Google Calendar Pending" },
  { labelKey: "WhatsApp Business Integration", valueKey: "Integration WhatsApp Pending" },
  { labelKey: "Instagram Integration", valueKey: "Integration Instagram Pending" },
  { labelKey: "Stripe Integration", valueKey: "Integration Stripe Foundation" },
  { labelKey: "Zapier Integration", valueKey: "Integration Zapier Pending" },
  { labelKey: "Make Integration", valueKey: "Integration Make Pending" },
  { labelKey: "N8N Integration", valueKey: "Integration N8N Pending" },
  { labelKey: "Webhook API", valueKey: "Integration Webhook Foundation" },
];

export default function IntegrationCenter() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🔌 {t("Integration Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("Integration Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>{t("Integration Mode Foundation", locale)}</Text>
        <Text style={styles.summaryLabel}>{t("Integration Channels", locale)}</Text>
      </View>

      <View style={styles.integrationList}>
        {INTEGRATION_ITEMS.map((integration) => (
          <View key={integration.labelKey} style={styles.integrationRow}>
            <Text style={styles.integrationLabel}>{t(integration.labelKey, locale)}</Text>
            <Text style={styles.integrationValue}>{t(integration.valueKey, locale)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t("Integration Foundation Note", locale)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.86)",
    borderRadius: UI.radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  overline: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: "rgba(242,209,122,0.12)",
    borderWidth: 1,
    borderColor: "#f2d17a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  integrationList: {
    gap: 10,
  },
  integrationRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  integrationLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  integrationValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
