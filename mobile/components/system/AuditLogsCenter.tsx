import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type AuditEvent = {
  titleKey: string;
  metaKey: string;
};

const AUDIT_EVENTS: AuditEvent[] = [
  { titleKey: "AI Module Enabled", metaKey: "Audit Time Today" },
  { titleKey: "System Status Reviewed", metaKey: "Audit Time Two Hours Ago" },
  { titleKey: "Subscription Updated", metaKey: "Audit Time Yesterday" },
  { titleKey: "Workspace Created", metaKey: "Audit Time Yesterday" },
  { titleKey: "User Signed In", metaKey: "Audit Time Two Days Ago" },
];

export default function AuditLogsCenter() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>📜 {t("Audit Logs Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("Audit Logs Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>{AUDIT_EVENTS.length}</Text>
        <Text style={styles.summaryLabel}>{t("Latest Activity", locale)}</Text>
      </View>

      <View style={styles.eventList}>
        {AUDIT_EVENTS.map((event) => (
          <View key={`${event.titleKey}-${event.metaKey}`} style={styles.eventRow}>
            <View style={styles.eventMarker} />
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{t(event.titleKey, locale)}</Text>
              <Text style={styles.eventMeta}>{t(event.metaKey, locale)}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t("Audit Logs Foundation Note", locale)}</Text>
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
  eventList: {
    gap: 10,
  },
  eventRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 12,
  },
  eventMarker: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: "#f2d17a",
    marginTop: 5,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  eventMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
