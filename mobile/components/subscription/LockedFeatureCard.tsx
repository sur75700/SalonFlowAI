import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import type { PricingPlanCode } from "../../lib/pricing/plans";
import { UI } from "../../lib/theme/tokens";

type Props = {
  title: string;
  requiredPlan: PricingPlanCode;
};

export default function LockedFeatureCard({
  title,
  requiredPlan,
}: Props) {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>

      <Text style={styles.title}>
        🔒 {t("Locked Feature", locale)}
      </Text>

      <Text style={styles.feature}>{title}</Text>

      <Text style={styles.meta}>
        {t("Requires Plan", locale)}: {requiredPlan.toUpperCase()}
      </Text>

      <Text style={styles.note}>
        {t("Locked Feature Upgrade Note", locale)}
      </Text>
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
    color: "#f2d17a",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  feature: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  meta: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10,
  },
});
