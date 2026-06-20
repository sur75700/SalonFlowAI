import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { useSession } from "../../hooks/useSession";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

export default function AccountOverviewCard() {
  const { locale } = useAppPreferences();
  const { sessionEmail, sessionUser } = useSession();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>👤 {t("Account Overview", locale)}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>{t("Account Email", locale)}</Text>
        <Text style={styles.value}>{sessionEmail || "—"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t("Account Role", locale)}</Text>
        <Text style={styles.value}>{sessionUser?.role || t("Account Role Owner", locale)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t("Current Plan", locale)}</Text>
        <Text style={styles.value}>{t("Pricing Plan Business", locale)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t("Account Status", locale)}</Text>
        <Text style={styles.active}>
          {sessionUser?.email_verified === false ? "Email pending verification" : t("Account Status Active", locale)}
        </Text>
      </View>
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
  row: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  value: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  active: {
    color: "#22c55e",
    fontSize: 15,
    fontWeight: "900",
  },
});
