import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { PRICING_PLANS } from "../../lib/pricing/plans";
import { UI } from "../../lib/theme/tokens";

export default function PricingPlansCard() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>{t("Pricing Packages", locale)}</Text>

      {PRICING_PLANS.map((plan) => (
        <View
          key={plan.code}
          style={[styles.plan, plan.highlighted ? styles.highlightedPlan : null]}
        >
          <Text style={styles.planName}>{t(plan.nameKey, locale)}</Text>
          <Text style={styles.price}>{t(plan.priceKey, locale)}</Text>
          <Text style={styles.tagline}>{t(plan.taglineKey, locale)}</Text>

          {plan.features.map((feature) => (
            <Text key={feature} style={styles.feature}>
              ✓ {t(feature, locale)}
            </Text>
          ))}
        </View>
      ))}
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
  plan: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginTop: 12,
  },
  highlightedPlan: {
    borderColor: "#f2d17a",
    backgroundColor: "rgba(242,209,122,0.12)",
  },
  planName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  price: {
    color: "#f2d17a",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  tagline: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 10,
  },
  feature: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
});
