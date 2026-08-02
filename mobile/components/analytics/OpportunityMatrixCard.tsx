import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";
import type {
  AnalyticsGrowthSummary,
  AnalyticsExecutiveDecision,
  AnalyticsClientRisk,
  AnalyticsMission,
} from "../../types/models";

type Props = {
  growthSummary?: AnalyticsGrowthSummary;
  executiveDecision?: AnalyticsExecutiveDecision;
  clientRisk?: AnalyticsClientRisk;
  missionControl?: AnalyticsMission[];
};

export default function OpportunityMatrixCard({
  growthSummary,
  executiveDecision,
  clientRisk,
  missionControl = [],
}: Props) {
  const { locale } = useAppPreferences();

  if (!growthSummary && !executiveDecision && !clientRisk && !missionControl.length) {
    return null;
  }

  const quickWin = missionControl[0];
  const strategicBet = growthSummary?.recommended_action || executiveDecision?.primary_action;
  const watchRisk = clientRisk?.risk_score || 0;

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🧭 {t("AI Opportunity Matrix", locale)}</Text>

      <View style={styles.grid}>
        <View style={styles.quadrant}>
          <Text style={styles.quadrantTitle}>🔥 {t("AI Matrix Quick Wins", locale)}</Text>
          <Text style={styles.quadrantValue}>
            {quickWin ? t(`AI Mission ${quickWin.code}`, locale as any) : t("AI Matrix No Action", locale)}
          </Text>
          <Text style={styles.quadrantMeta}>
            {quickWin ? `+${Math.round(quickWin.impact).toLocaleString()} AMD · ${quickWin.confidence}%` : "—"}
          </Text>
        </View>

        <View style={styles.quadrant}>
          <Text style={styles.quadrantTitle}>🚀 {t("AI Matrix Strategic Bets", locale)}</Text>
          <Text style={styles.quadrantValue}>
            {strategicBet ? t(`AI Action ${strategicBet}`, locale as any) : t("AI Matrix No Action", locale)}
          </Text>
          <Text style={styles.quadrantMeta}>
            {growthSummary ? `+${Math.round(growthSummary.growth_opportunity).toLocaleString()} AMD` : "—"}
          </Text>
        </View>

        <View style={styles.quadrant}>
          <Text style={styles.quadrantTitle}>🛡 {t("AI Matrix Stability", locale)}</Text>
          <Text style={styles.quadrantValue}>
            {t("AI Matrix Protect Pipeline", locale)}
          </Text>
          <Text style={styles.quadrantMeta}>
            {executiveDecision ? `${executiveDecision.decision_score}% ${t("AI Decision Score", locale)}` : "—"}
          </Text>
        </View>

        <View style={styles.quadrant}>
          <Text style={styles.quadrantTitle}>⚠️ {t("AI Matrix Watchlist", locale)}</Text>
          <Text style={styles.quadrantValue}>
            {t("AI Client Risk", locale)}
          </Text>
          <Text style={styles.quadrantMeta}>
            {watchRisk}% {t("AI Client Risk Score", locale)}
          </Text>
        </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quadrant: {
    width: "48%",
    minHeight: 120,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  quadrantTitle: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },
  quadrantValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  quadrantMeta: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
});
