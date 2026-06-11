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
              <Text style={styles.itemTitle} numberOfLines={1} adjustsFontSizeToFit>
                {insightTitle(item, locale)}
              </Text>
              <Text style={styles.itemMessage}>
                {insightMessage(item, locale)}
              </Text>

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
    borderRadius: UI.radius.xl,
    padding: UI.spacing.lg,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#4c3575",
    boxShadow: UI.depth.hero,
    elevation: 12,
  },
  overline: {
    color: "#f2d17a",
    fontSize: UI.font.tiny,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 21,
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
    borderRadius: UI.radius.md,
    padding: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#2f3650",
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
  actionBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2f3650",
  },
  actionLabel: {
    color: "#7dd3fc",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
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
