import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { UI } from "../../lib/theme/tokens";
import type { AnalyticsInsight } from "../../types/models";

type Props = {
  insights?: AnalyticsInsight[];
};

export default function AIInsightsCard({ insights = [] }: Props) {
  const visibleInsights = insights.slice(0, 5);

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>AI COMMAND CENTER</Text>
      <Text style={styles.title}>AI Business Insights</Text>
      <Text style={styles.subtitle}>
        Smart signals generated from revenue, bookings, cancellations, and services.
      </Text>

      <View style={styles.list}>
        {visibleInsights.length ? (
          visibleInsights.map((item, index) => (
            <View key={`${item.type}-${index}`} style={styles.item}>
              <Text style={styles.itemTitle} numberOfLines={1} adjustsFontSizeToFit>
                {item.title}
              </Text>
              <Text style={styles.itemMessage}>{item.message}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Create more booking activity to unlock AI business insights.
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
  emptyText: {
    color: "#c9c2cf",
    fontSize: 13,
    lineHeight: 18,
  },
});
