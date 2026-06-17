import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

export default function SubscriptionStatusCard() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>📦 {t("Subscription Center", locale)}</Text>

      <View style={styles.statusBox}>
        <Text style={styles.plan}>{t("Pricing Plan Business", locale)}</Text>
        <Text style={styles.status}>{t("Subscription Status Active", locale)}</Text>
        <Text style={styles.meta}>{t("Subscription Billing Placeholder", locale)}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.value}>{t("Subscription AI Access Full", locale)}</Text>
          <Text style={styles.label}>{t("Subscription AI Access", locale)}</Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.value}>{t("Subscription Workspace Limit Single", locale)}</Text>
          <Text style={styles.label}>{t("Subscription Workspace Limit", locale)}</Text>
        </View>
      </View>

      <Text style={styles.note}>{t("Subscription Upgrade Note", locale)}</Text>
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
    marginBottom: 18,
  },
  statusBox: {
    backgroundColor: "rgba(242,209,122,0.12)",
    borderColor: "#f2d17a",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  plan: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  status: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 6,
  },
  meta: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 18,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  cell: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  value: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 12,
  },
});
