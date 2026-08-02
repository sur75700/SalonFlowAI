import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type SyncItem = {
  labelKey: string;
  valueKey: string;
};

const SYNC_ITEMS: SyncItem[] = [
  { labelKey: "Plan Source", valueKey: "Sync Plan Source Internal" },
  { labelKey: "Billing Sync State", valueKey: "Sync Billing Pending" },
  { labelKey: "Feature Gate Sync", valueKey: "Sync Feature Gates Active" },
  { labelKey: "Stripe Customer Sync", valueKey: "Sync Stripe Pending" },
  { labelKey: "Webhook Readiness", valueKey: "Sync Webhook Foundation" },
  { labelKey: "Last Sync", valueKey: "Sync Last Sync Placeholder" },
];

export default function SubscriptionSyncCenter() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🔄 {t("Subscription Sync Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("Subscription Sync Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>{t("Sync Mode Foundation", locale)}</Text>
        <Text style={styles.summaryLabel}>{t("Subscription Sync Layer", locale)}</Text>
      </View>

      <View style={styles.itemList}>
        {SYNC_ITEMS.map((item) => (
          <View key={item.labelKey} style={styles.itemRow}>
            <Text style={styles.itemLabel}>{t(item.labelKey, locale)}</Text>
            <Text style={styles.itemValue}>{t(item.valueKey, locale)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t("Subscription Sync Foundation Note", locale)}</Text>
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
  itemList: {
    gap: 10,
  },
  itemRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  itemLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  itemValue: {
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
