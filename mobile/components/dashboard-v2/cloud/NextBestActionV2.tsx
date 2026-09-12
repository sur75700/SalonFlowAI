import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import type { NextBestAction, NextBestActionCategory } from "../../../lib/dashboard/nextBestAction";
import type { IntelligenceDecisionStatus } from "../../../hooks/useIntelligenceDecision";

export type NextBestActionLabels = Readonly<{
  title: string;
  subtitle: string;
  makeMoney: string;
  preventLoss: string;
  improveOperations: string;
  evidence: string;
  expectedImpact: string;
  confidence: string;
  open: string;
  empty: string;
  emptyDetail: string;
  loading: string;
  unavailable: string;
  retry: string;
  locked: string;
  upgrade: string;
}>;

export type NextBestActionV2Props = Readonly<{
  actions: readonly NextBestAction[];
  status: IntelligenceDecisionStatus;
  labels: NextBestActionLabels;
  onActionPress: (action: NextBestAction) => void;
  onRetry?: () => void;
  onUpgrade?: () => void;
}>;

function categoryLabel(category: NextBestActionCategory, labels: NextBestActionLabels): string {
  if (category === "MAKE_MONEY") return labels.makeMoney;
  if (category === "PREVENT_LOSS") return labels.preventLoss;
  return labels.improveOperations;
}

function formatImpact(action: NextBestAction): string {
  const impact = action.expectedImpacts[0];
  if (!impact) return "";
  const sign = impact.estimated_change > 0 ? "+" : "";
  return `${sign}${impact.estimated_change} ${impact.unit} · ${impact.timeframe_days}d`;
}

function NextBestActionV2({
  actions,
  status,
  labels,
  onActionPress,
  onRetry,
  onUpgrade,
}: NextBestActionV2Props) {
  const { theme } = useDashboardTheme();
  const cardStyle = {
    backgroundColor: theme.palette.surface,
    borderColor: theme.palette.border,
  };

  if (status === "not_entitled") {
    return (
      <View style={[styles.shell, cardStyle]}>
        <Text style={styles.eyebrow}>{labels.title}</Text>
        <Text style={styles.stateTitle}>{labels.locked}</Text>
        {onUpgrade ? (
          <Pressable accessibilityRole="button" onPress={onUpgrade} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{labels.upgrade}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if ((status === "idle" || status === "loading") && actions.length === 0) {
    return (
      <View style={[styles.shell, cardStyle]}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={theme.palette.royal} />
          <Text style={styles.stateTitle}>{labels.loading}</Text>
        </View>
      </View>
    );
  }

  if (status === "error" && actions.length === 0) {
    return (
      <View style={[styles.shell, cardStyle]}>
        <Text style={styles.eyebrow}>{labels.title}</Text>
        <Text style={styles.stateTitle}>{labels.unavailable}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{labels.retry}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.shell, cardStyle]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{labels.title}</Text>
          <Text style={styles.subtitle}>{labels.subtitle}</Text>
        </View>
        {status === "refreshing" ? <ActivityIndicator size="small" color={theme.palette.royal} /> : null}
      </View>

      {actions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{labels.empty}</Text>
          <Text style={styles.emptyDetail}>{labels.emptyDetail}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {actions.slice(0, 3).map((action) => (
            <View key={action.code} style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Text style={styles.category}>{categoryLabel(action.category, labels)}</Text>
                <Text style={styles.priority}>P{action.priority}</Text>
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>{labels.evidence}</Text>
                  <Text style={styles.metaValue} numberOfLines={2}>
                    {action.evidence[0]?.description ?? "—"}
                  </Text>
                </View>
                <View style={styles.metaBlockCompact}>
                  <Text style={styles.metaLabel}>{labels.expectedImpact}</Text>
                  <Text style={styles.metaValue}>{formatImpact(action)}</Text>
                  <Text style={styles.confidence}>
                    {labels.confidence}: {Math.round(action.confidence.score * 100)}%
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${labels.open}: ${action.title}`}
                onPress={() => onActionPress(action)}
                style={({ pressed }) => [styles.actionButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.actionButtonText}>{labels.open}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 24, borderWidth: 1, padding: 18 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#E8C97A", fontSize: 11, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  subtitle: { marginTop: 6, color: "#A6A7C4", fontSize: 12, lineHeight: 18 },
  stateWrap: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 12 },
  stateTitle: { marginTop: 8, color: "#F6F5FB", fontSize: 15, fontWeight: "700", lineHeight: 22 },
  emptyState: { marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 16 },
  emptyTitle: { color: "#F6F5FB", fontSize: 14, fontWeight: "700" },
  emptyDetail: { marginTop: 5, color: "#8C8EAA", fontSize: 12, lineHeight: 18 },
  list: { marginTop: 14, gap: 12 },
  actionCard: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(232,201,122,0.14)", backgroundColor: "rgba(13,14,30,0.48)", padding: 14 },
  actionHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  category: { color: "#D7C6FF", fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" },
  priority: { color: "#E8C97A", fontSize: 10, fontWeight: "800" },
  actionTitle: { marginTop: 8, color: "#F8F7FD", fontSize: 15, fontWeight: "800", lineHeight: 21 },
  actionDescription: { marginTop: 4, color: "#A6A7C4", fontSize: 12, lineHeight: 18 },
  metaRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaBlock: { flex: 1, minWidth: 180 },
  metaBlockCompact: { minWidth: 140 },
  metaLabel: { color: "#6F7092", fontSize: 9, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  metaValue: { marginTop: 4, color: "#E7E7F1", fontSize: 11, lineHeight: 16 },
  confidence: { marginTop: 4, color: "#8C8EAA", fontSize: 10 },
  actionButton: { marginTop: 12, alignSelf: "flex-start", borderRadius: 999, backgroundColor: "rgba(124,92,255,0.18)", borderWidth: 1, borderColor: "rgba(124,92,255,0.42)", paddingHorizontal: 14, paddingVertical: 8 },
  actionButtonText: { color: "#EAE4FF", fontSize: 11, fontWeight: "800" },
  primaryButton: { marginTop: 14, alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#8B5CF6", paddingHorizontal: 16, paddingVertical: 10 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  secondaryButton: { marginTop: 14, alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: "rgba(124,92,255,0.45)", paddingHorizontal: 16, paddingVertical: 10 },
  secondaryButtonText: { color: "#D7C6FF", fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.78 },
});

export default React.memo(NextBestActionV2);
