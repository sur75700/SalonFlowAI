import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string | number;
  variant?: "default" | "accent";
};

function getIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("client")) return "👥";
  if (normalized.includes("service")) return "✂️";
  if (normalized.includes("booking") || normalized.includes("appointment")) return "📅";
  if (normalized.includes("scheduled")) return "🟦";
  if (normalized.includes("completed")) return "✅";
  if (normalized.includes("cancelled") || normalized.includes("canceled")) return "⚠️";
  if (normalized.includes("today")) return "⚡";
  if (normalized.includes("revenue")) return "💰";
  if (normalized.includes("pipeline")) return "🚀";

  return "💎";
}

function getSignal(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("cancelled") || normalized.includes("canceled")) {
    return "Needs attention";
  }

  if (normalized.includes("completed")) return "Operational proof";
  if (normalized.includes("scheduled")) return "Pipeline active";
  if (normalized.includes("today")) return "Live activity";
  if (normalized.includes("revenue")) return "Growth signal";
  if (normalized.includes("client")) return "Client base";
  if (normalized.includes("service")) return "Offer strength";
  if (normalized.includes("booking") || normalized.includes("appointment")) return "Demand pulse";

  return "Executive signal";
}

export default function StatCard({
  label,
  value,
  variant = "default",
}: Props) {
  const icon = getIcon(label);
  const signal = getSignal(label);

  return (
    <View style={[styles.card, variant === "accent" && styles.cardAccent]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, variant === "accent" && styles.iconWrapAccent]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={[styles.signalPill, variant === "accent" && styles.signalPillAccent]}>
          <Text style={[styles.signalText, variant === "accent" && styles.signalTextAccent]}>
            LIVE
          </Text>
        </View>
      </View>

      <Text style={[styles.value, variant === "accent" && styles.valueAccent]}>
        {value}
      </Text>

      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>

      <View style={styles.footerLine}>
        <Text style={styles.signalLabel} numberOfLines={1}>
          {signal}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minWidth: 0,
    maxWidth: undefined,
    minHeight: 132,
    backgroundColor: "rgba(10, 11, 16, 0.86)",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderWidth: 1.2,
    boxShadow: UI.depth.card,
    elevation: 14,
    borderColor: "rgba(242, 209, 122, 0.24)",
    overflow: "hidden",
  },
  cardAccent: {
    backgroundColor: "rgba(21, 19, 32, 0.9)",
    borderColor: "rgba(196, 161, 255, 0.38)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242, 209, 122, 0.12)",
    borderWidth: 1.2,
    borderColor: "rgba(242, 209, 122, 0.28)",
  },
  iconWrapAccent: {
    backgroundColor: "rgba(196, 161, 255, 0.13)",
    borderColor: "rgba(196, 161, 255, 0.32)",
  },
  icon: {
    fontSize: 17,
  },
  signalPill: {
    borderRadius: UI.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1.2,
    borderColor: "rgba(34, 197, 94, 0.22)",
  },
  signalPillAccent: {
    backgroundColor: "rgba(196, 161, 255, 0.12)",
    borderColor: "rgba(196, 161, 255, 0.28)",
  },
  signalText: {
    color: "#bbf7d0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  signalTextAccent: {
    color: "#e8ddff",
  },
  value: {
    color: "#f5d27a",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    marginBottom: 6,
  },
  valueAccent: {
    color: "#c4a1ff",
  },
  label: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.75,
    marginBottom: 12,
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 9,
  },
  signalLabel: {
    color: "rgba(232, 221, 255, 0.72)",
    fontSize: 11,
    fontWeight: "700",
  },
});
