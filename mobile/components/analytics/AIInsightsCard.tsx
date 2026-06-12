import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { UI } from "../../lib/theme/tokens";
import { t } from "../../lib/i18n";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import type { AnalyticsInsight } from "../../types/models";

type Props = {
  insights?: AnalyticsInsight[];
  forecast?: {
    revenue_7_days: number;
    revenue_30_days: number;
    confidence: number;
    trend: string;
  };
  riskSummary?: {
    active_risks: number;
    highest_risk_code: string;
    highest_risk_score: number;
    risk_level: string;
  };
  growthSummary?: {
    growth_score: number;
    growth_level: string;
    best_service: string;
    growth_opportunity: number;
    recommended_action: string;
  };
  executiveDecision?: {
    decision_score: number;
    decision_level: string;
    headline: string;
    primary_action: string;
    secondary_action: string;
    expected_impact: number;
  };
};


function interpolate(template: string, params: AnalyticsInsight["params"] = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params?.[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function insightIcon(item: AnalyticsInsight) {
  if (item.tone === "warning") return "⚠️";
  if (item.type === "service") return "👑";
  if (item.type === "growth" || item.type === "trend") return "📈";
  if (item.type === "ticket") return "💎";
  return "⚡";
}

function insightTitle(item: AnalyticsInsight, locale: string) {
  if (!item.code) return item.title;
  const translated = t(`AI Insight ${item.code} Title`, locale as any);
  return translated === `AI Insight ${item.code} Title`
    ? item.title
    : interpolate(translated, item.params);
}


function insightAction(item: AnalyticsInsight, locale: string) {
  if (!item.action_code) return "";

  const translated = t(
    `AI Action ${item.action_code}`,
    locale as any
  );

  return translated === `AI Action ${item.action_code}`
    ? item.action_code
    : translated;
}

function priorityLabel(item: AnalyticsInsight, locale: string) {
  const level = (item.priority_level || "").toLowerCase();

  if (level === "high") return `🔴 ${t("AI Priority High", locale as any)}`;
  if (level === "medium") return `🟠 ${t("AI Priority Medium", locale as any)}`;
  if (level === "low") return `🟢 ${t("AI Priority Low", locale as any)}`;

  return "";
}

function confidenceLabel(item: AnalyticsInsight, locale: string) {
  if (typeof item.confidence !== "number") return "";

  return `${item.confidence}% ${t("AI Confidence", locale as any)}`;
}

function opportunityLabel(item: AnalyticsInsight, locale: string) {
  if (!item.opportunity_code) return "";

  const translated = t(`AI Opportunity ${item.opportunity_code}`, locale as any);

  return translated === `AI Opportunity ${item.opportunity_code}`
    ? item.opportunity_code.replace(/_/g, " ")
    : translated;
}

function impactLabel(item: AnalyticsInsight, locale: string) {
  if (!item.impact_code) return "";

  const translated = t(`AI Impact ${item.impact_code}`, locale as any);

  return translated === `AI Impact ${item.impact_code}`
    ? item.impact_code.replace(/_/g, " ")
    : translated;
}

function buildHealthScore(items: AnalyticsInsight[]) {
  if (!items.length) {
    return {
      score: 0,
      label: "waiting",
    };
  }

  const confidenceValues = items
    .map((item) => item.confidence)
    .filter((value): value is number => typeof value === "number");

  const averageConfidence = confidenceValues.length
    ? Math.round(
        confidenceValues.reduce((total, value) => total + value, 0) /
          confidenceValues.length
      )
    : 70;

  const highPriorityCount = items.filter(
    (item) => (item.priority_level || "").toLowerCase() === "high"
  ).length;
  const warningCount = items.filter((item) => item.tone === "warning").length;
  const growthSignals = items.filter(
    (item) => item.tone === "success" || item.type === "service"
  ).length;

  const rawScore =
    averageConfidence +
    growthSignals * 3 -
    highPriorityCount * 6 -
    warningCount * 4;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let label = "critical";
  if (score >= 95) label = "elite";
  else if (score >= 85) label = "strong";
  else if (score >= 70) label = "healthy";
  else if (score >= 50) label = "needs_attention";

  return {
    score,
    label,
  };
}

function buildExecutiveSummary(items: AnalyticsInsight[]) {
  const activeCount = items.length;
  const highPriorityCount = items.filter(
    (item) => (item.priority_level || "").toLowerCase() === "high"
  ).length;

  const confidenceValues = items
    .map((item) => item.confidence)
    .filter((value): value is number => typeof value === "number");

  const averageConfidence = confidenceValues.length
    ? Math.round(
        confidenceValues.reduce((total, value) => total + value, 0) /
          confidenceValues.length
      )
    : 0;

  const topAction =
    items.find((item) => (item.priority_level || "").toLowerCase() === "high")
      ?.action_code ||
    items.find((item) => item.action_code)?.action_code ||
    "";

  return {
    activeCount,
    highPriorityCount,
    averageConfidence,
    topAction,
  };
}

function insightMessage(item: AnalyticsInsight, locale: string) {
  if (!item.code) return item.message;
  const translated = t(`AI Insight ${item.code} Message`, locale as any);
  return translated === `AI Insight ${item.code} Message`
    ? item.message
    : interpolate(translated, item.params);
}

export default function AIInsightsCard({ insights = [], forecast, riskSummary, growthSummary, executiveDecision }: Props) {
  const { locale } = useAppPreferences();
  const visibleInsights = insights.slice(0, 5);
  const executiveSummary = buildExecutiveSummary(visibleInsights);
  const healthScore = buildHealthScore(visibleInsights);

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>{t("AI Command Center", locale)}</Text>
      <Text style={styles.title}>{t("AI Business Insights", locale)}</Text>
      <Text style={styles.subtitle}>
        {t("AI Business Insights Subtitle", locale)}
      </Text>

      {visibleInsights.length ? (
        <View style={styles.summaryPanel}>
          <View style={styles.healthScorePanel}>
            <Text style={styles.healthLabel}>{t("AI Score", locale)}</Text>
            <Text style={styles.healthValue}>{healthScore.score} / 100</Text>
            <Text style={styles.healthBadge}>
              {t(
                `AI Health ${healthScore.label
                  .replace("_", " ")
                  .replace(/\b\w/g, (letter) => letter.toUpperCase())}`,
                locale as any
              )}
            </Text>
          </View>

          {executiveDecision ? (
            <View style={styles.decisionPanel}>
              <Text style={styles.decisionTitle}>
                👑 {t("AI CEO Brief", locale)}
              </Text>

              <Text style={styles.decisionHeadline}>
                {t(`AI Decision Headline ${executiveDecision.headline}`, locale as any)}
              </Text>

              <View style={styles.decisionGrid}>
                <View style={styles.decisionCell}>
                  <Text style={styles.decisionValue}>{executiveDecision.decision_score}%</Text>
                  <Text style={styles.decisionLabel}>{t("AI Decision Score", locale)}</Text>
                </View>

                <View style={styles.decisionCell}>
                  <Text style={styles.decisionValue}>
                    +{Math.round(executiveDecision.expected_impact).toLocaleString()} AMD
                  </Text>
                  <Text style={styles.decisionLabel}>{t("AI Expected Impact Value", locale)}</Text>
                </View>
              </View>

              <Text style={styles.decisionLevel}>
                {t(`AI Decision Level ${executiveDecision.decision_level}`, locale as any)}
              </Text>

              <Text style={styles.decisionAction}>
                {t("AI Action Now", locale)}: {t(`AI Action ${executiveDecision.primary_action}`, locale as any)}
              </Text>

              <Text style={styles.decisionAction}>
                {t("AI Secondary Action", locale)}: {t(`AI Action ${executiveDecision.secondary_action}`, locale as any)}
              </Text>
            </View>
          ) : null}

          {forecast ? (
            <View style={styles.forecastPanel}>
              <Text style={styles.forecastTitle}>
                {t("AI Revenue Forecast", locale)}
              </Text>

              <View style={styles.forecastGrid}>
                <View style={styles.forecastCell}>
                  <Text style={styles.forecastValue}>
                    {Math.round(forecast.revenue_7_days).toLocaleString()} AMD
                  </Text>
                  <Text style={styles.forecastLabel}>
                    {t("AI Forecast 7 Days", locale)}
                  </Text>
                </View>

                <View style={styles.forecastCell}>
                  <Text style={styles.forecastValue}>
                    {Math.round(forecast.revenue_30_days).toLocaleString()} AMD
                  </Text>
                  <Text style={styles.forecastLabel}>
                    {t("AI Forecast 30 Days", locale)}
                  </Text>
                </View>
              </View>

              <Text style={styles.forecastMeta}>
                {t("AI Forecast Confidence", locale)}: {forecast.confidence}% · {t(`AI Forecast Trend ${forecast.trend}`, locale as any)}
              </Text>
            </View>
          ) : null}

          {riskSummary ? (
            <View style={styles.riskPanel}>
              <Text style={styles.riskTitle}>
                ⚠️ {t("AI Risk Command Center", locale)}
              </Text>

              <View style={styles.riskGrid}>
                <View style={styles.riskCell}>
                  <Text style={styles.riskValue}>{riskSummary.active_risks}</Text>
                  <Text style={styles.riskLabel}>{t("AI Active Risks", locale)}</Text>
                </View>

                <View style={styles.riskCell}>
                  <Text style={styles.riskValue}>{riskSummary.highest_risk_score}%</Text>
                  <Text style={styles.riskLabel}>{t("AI Risk Score", locale)}</Text>
                </View>
              </View>

              <Text style={styles.riskMeta}>
                {t("AI Highest Risk", locale)}: {t(`AI Risk ${riskSummary.highest_risk_code}`, locale as any)}
              </Text>

              <Text style={styles.riskLevel}>
                {t(`AI Risk Level ${riskSummary.risk_level}`, locale as any)}
              </Text>
            </View>
          ) : null}

          {growthSummary ? (
            <View style={styles.growthPanel}>
              <Text style={styles.growthTitle}>
                🚀 {t("AI Growth Intelligence", locale)}
              </Text>

              <View style={styles.growthGrid}>
                <View style={styles.growthCell}>
                  <Text style={styles.growthValue}>{growthSummary.growth_score}%</Text>
                  <Text style={styles.growthLabel}>{t("AI Growth Score", locale)}</Text>
                </View>

                <View style={styles.growthCell}>
                  <Text style={styles.growthValue}>
                    +{Math.round(growthSummary.growth_opportunity).toLocaleString()} AMD
                  </Text>
                  <Text style={styles.growthLabel}>{t("AI Growth Opportunity", locale)}</Text>
                </View>
              </View>

              <Text style={styles.growthMeta}>
                {t("AI Best Growth Service", locale)}: {growthSummary.best_service}
              </Text>

              <Text style={styles.growthLevel}>
                {t(`AI Growth Level ${growthSummary.growth_level}`, locale as any)}
              </Text>

              <Text style={styles.growthAction}>
                {t("AI Growth Recommended Action", locale)}: {t(`AI Action ${growthSummary.recommended_action}`, locale as any)}
              </Text>
            </View>
          ) : null}

          <Text style={styles.summaryOverline}>{t("AI Executive Summary", locale)}</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{executiveSummary.activeCount}</Text>
              <Text style={styles.summaryLabel}>{t("AI Active Insights", locale)}</Text>
            </View>

            <View style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{executiveSummary.highPriorityCount}</Text>
              <Text style={styles.summaryLabel}>{t("AI High Priority", locale)}</Text>
            </View>

            <View style={styles.summaryCell}>
              <Text style={styles.summaryValue}>
                {executiveSummary.averageConfidence}%
              </Text>
              <Text style={styles.summaryLabel}>{t("AI Avg Confidence", locale)}</Text>
            </View>
          </View>

          {executiveSummary.topAction ? (
            <View style={styles.topActionBox}>
              <Text style={styles.topActionLabel}>{t("AI Top Action", locale)}</Text>
              <Text style={styles.topActionText}>
                {t(`AI Action ${executiveSummary.topAction}`, locale as any)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.list}>
        {visibleInsights.length ? (
          visibleInsights.map((item, index) => (
            <View key={`${item.type}-${index}`} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.iconBubble}>
                  <Text style={styles.iconText}>{insightIcon(item)}</Text>
                </View>

                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle} numberOfLines={2} adjustsFontSizeToFit>
                    {insightTitle(item, locale)}
                  </Text>

                  <Text style={styles.itemMessage}>
                    {insightMessage(item, locale)}
                  </Text>

                  <View style={styles.metaRow}>
                    {priorityLabel(item, locale) ? (
                      <Text style={styles.priorityPill}>{priorityLabel(item, locale)}</Text>
                    ) : null}

                    {confidenceLabel(item, locale) ? (
                      <Text style={styles.confidencePill}>{confidenceLabel(item, locale)}</Text>
                    ) : null}
                  </View>

                  {impactLabel(item, locale) ? (
                    <Text style={styles.impactText}>
                      {t("AI Expected Impact", locale)}: {impactLabel(item, locale)}
                    </Text>
                  ) : null}
                </View>
              </View>

              {item.action_code ? (
                <View style={styles.actionBox}>
                  <Text style={styles.actionLabel}>
                    ⚡ {t("AI Recommended Action", locale)}
                  </Text>

                  <Text style={styles.actionText}>
                    {insightAction(item, locale)}
                  </Text>

                  {typeof item.opportunity_amount === "number" ? (
                    <View style={styles.opportunityBox}>
                      <Text style={styles.opportunityLabel}>
                        💰 {t("AI Revenue Opportunity", locale)}
                      </Text>

                      <Text style={styles.opportunityValue}>
                        +{Math.round(item.opportunity_amount).toLocaleString()} AMD
                      </Text>

                      {opportunityLabel(item, locale) ? (
                        <Text style={styles.opportunityText}>
                          {opportunityLabel(item, locale)}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {t("AI Business Insights Empty", locale)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#10131f",
    borderRadius: UI.radius.hero,
    padding: UI.spacing.lg,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#6d4fc2",
    boxShadow: "0px 16px 32px rgba(124, 58, 237, 0.26)",
    elevation: 16,
  },
  overline: {
    color: "#f2d17a",
    fontSize: UI.font.tiny,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  summaryPanel: {
    backgroundColor: "#12172a",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#5b45a3",
    marginBottom: 14,
  },
  healthScorePanel: {
    backgroundColor: "#0b1020",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#f2d17a",
    marginBottom: 12,
  },
  healthLabel: {
    color: "#f2d17a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  healthValue: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  healthBadge: {
    color: "#a7f3d0",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  decisionPanel: {
    backgroundColor: "#1b1530",
    borderRadius: UI.radius.hero,
    padding: UI.spacing.lg,
    borderWidth: 1,
    borderColor: "#f2d17a",
    marginBottom: 12,
  },
  decisionTitle: {
    color: "#f2d17a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  decisionHeadline: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: 12,
  },
  decisionGrid: {
    flexDirection: "row",
    gap: 8,
  },
  decisionCell: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: UI.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#4c3575",
  },
  decisionValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  decisionLabel: {
    color: "#ddd6fe",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  decisionLevel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
    textTransform: "uppercase",
  },
  decisionAction: {
    color: "#ede9fe",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 5,
  },
  forecastPanel: {
    backgroundColor: "#0f1e2e",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#155e75",
    marginBottom: 12,
  },
  forecastTitle: {
    color: "#7dd3fc",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  forecastGrid: {
    flexDirection: "row",
    gap: 8,
  },
  forecastCell: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: UI.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1f3b52",
  },
  forecastValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },
  forecastLabel: {
    color: "#bae6fd",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  forecastMeta: {
    color: "#d8dce6",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 10,
  },
  riskPanel: {
    backgroundColor: "#2a141a",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    marginBottom: 12,
  },
  riskTitle: {
    color: "#fecaca",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  riskGrid: {
    flexDirection: "row",
    gap: 8,
  },
  riskCell: {
    flex: 1,
    backgroundColor: "#171b27",
    borderRadius: UI.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#4b1d25",
  },
  riskValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  riskLabel: {
    color: "#fecaca",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  riskMeta: {
    color: "#fca5a5",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 10,
  },
  riskLevel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
    textTransform: "uppercase",
  },
  growthPanel: {
    backgroundColor: "#102117",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#166534",
    marginBottom: 12,
  },
  growthTitle: {
    color: "#86efac",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  growthGrid: {
    flexDirection: "row",
    gap: 8,
  },
  growthCell: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: UI.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1f3b2d",
  },
  growthValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  growthLabel: {
    color: "#bbf7d0",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  growthMeta: {
    color: "#bbf7d0",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 10,
  },
  growthLevel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
    textTransform: "uppercase",
  },
  growthAction: {
    color: "#dcfce7",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 6,
  },
  summaryOverline: {
    color: "#f2d17a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#171b27",
    borderRadius: UI.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#2f3650",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 3,
  },
  summaryLabel: {
    color: "#b7adbf",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
    textTransform: "uppercase",
  },
  topActionBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2f3650",
  },
  topActionLabel: {
    color: "#7dd3fc",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  topActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: "#171b27",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#37405d",
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#241b3a",
    borderWidth: 1,
    borderColor: "#6d4fc2",
  },
  iconText: {
    fontSize: 16,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 5,
  },
  itemMessage: {
    color: "#d8dce6",
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  priorityPill: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: UI.radius.pill,
    backgroundColor: "#3a1f2f",
    borderWidth: 1,
    borderColor: "#7f1d1d",
    overflow: "hidden",
  },
  confidencePill: {
    color: "#d8b4fe",
    fontSize: 10,
    fontWeight: "900",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: UI.radius.pill,
    backgroundColor: "#211536",
    borderWidth: 1,
    borderColor: "#6d4fc2",
    overflow: "hidden",
  },
  impactText: {
    color: "#a7f3d0",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 8,
  },
  actionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: UI.radius.md,
    backgroundColor: "#0f2433",
    borderWidth: 1,
    borderColor: "#155e75",
  },
  actionLabel: {
    color: "#7dd3fc",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  opportunityBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f3b2d",
  },
  opportunityLabel: {
    color: "#86efac",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  opportunityValue: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  opportunityText: {
    color: "#bbf7d0",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  emptyText: {
    color: "#c9c2cf",
    fontSize: 13,
    lineHeight: 18,
  },
});
