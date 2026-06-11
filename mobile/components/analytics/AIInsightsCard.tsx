import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { UI } from "../../lib/theme/tokens";
import { t } from "../../lib/i18n";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import type { AnalyticsInsight } from "../../types/models";

type Props = {
  insights?: AnalyticsInsight[];
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

function priorityLabel(item: AnalyticsInsight) {
  const level = (item.priority_level || "").toLowerCase();

  if (level === "high") return "🔴 HIGH";
  if (level === "medium") return "🟠 MEDIUM";
  if (level === "low") return "🟢 LOW";

  return "";
}

function confidenceLabel(item: AnalyticsInsight) {
  if (typeof item.confidence !== "number") return "";

  return `${item.confidence}% AI Confidence`;
}

function impactLabel(item: AnalyticsInsight) {
  if (!item.impact_code) return "";

  return item.impact_code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function insightMessage(item: AnalyticsInsight, locale: string) {
  if (!item.code) return item.message;
  const translated = t(`AI Insight ${item.code} Message`, locale as any);
  return translated === `AI Insight ${item.code} Message`
    ? item.message
    : interpolate(translated, item.params);
}

export default function AIInsightsCard({ insights = [] }: Props) {
  const { locale } = useAppPreferences();
  const visibleInsights = insights.slice(0, 5);

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>{t("AI Command Center", locale)}</Text>
      <Text style={styles.title}>{t("AI Business Insights", locale)}</Text>
      <Text style={styles.subtitle}>
        {t("AI Business Insights Subtitle", locale)}
      </Text>

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
                    {priorityLabel(item) ? (
                      <Text style={styles.priorityPill}>{priorityLabel(item)}</Text>
                    ) : null}

                    {confidenceLabel(item) ? (
                      <Text style={styles.confidencePill}>{confidenceLabel(item)}</Text>
                    ) : null}
                  </View>

                  {impactLabel(item) ? (
                    <Text style={styles.impactText}>
                      Expected Impact: {impactLabel(item)}
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
  emptyText: {
    color: "#c9c2cf",
    fontSize: 13,
    lineHeight: 18,
  },
});
