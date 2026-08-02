import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type SystemStatus = "operational" | "degraded" | "offline";

type SystemService = {
  nameKey: string;
  status: SystemStatus;
};

const SYSTEM_SERVICES: SystemService[] = [
  { nameKey: "Backend API", status: "operational" },
  { nameKey: "Database", status: "operational" },
  { nameKey: "AI Engine", status: "operational" },
  { nameKey: "Notification Service", status: "operational" },
  { nameKey: "Storage Service", status: "operational" },
  { nameKey: "Billing Service", status: "operational" },
];

function statusLabelKey(status: SystemStatus) {
  if (status === "degraded") return "Status Degraded";
  if (status === "offline") return "Status Offline";
  return "Status Operational";
}

export default function SystemStatusCenter() {
  const { locale } = useAppPreferences();
  const operationalCount = SYSTEM_SERVICES.filter(
    (service) => service.status === "operational"
  ).length;

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🛰️ {t("System Status Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("System Status Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>
          {operationalCount}/{SYSTEM_SERVICES.length}
        </Text>
        <Text style={styles.summaryLabel}>{t("Systems Operational", locale)}</Text>
      </View>

      <View style={styles.statusList}>
        {SYSTEM_SERVICES.map((service) => (
          <View key={service.nameKey} style={styles.statusRow}>
            <View style={styles.serviceMeta}>
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.serviceName}>{t(service.nameKey, locale)}</Text>
            </View>

            <Text style={styles.statusBadge}>
              {t(statusLabelKey(service.status), locale)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t("System Status Foundation Note", locale)}</Text>
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
    fontSize: 24,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  statusList: {
    gap: 10,
  },
  statusRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "900",
  },
  serviceName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  statusBadge: {
    alignSelf: "flex-start",
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
