import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string | number;
  variant?: "default" | "accent";
};

function getKpiMeta(label: string) {
  const n = label.toLowerCase();

  if (n.includes("cancelled") || n.includes("canceled")) {
    return { icon: "⚠️", signal: "Needs attention", trend: "Review", tone: "warning" as const };
  }
  if (n.includes("completed")) return { icon: "✅", signal: "Operational proof", trend: "Stable", tone: "success" as const };
  if (n.includes("scheduled")) return { icon: "🟦", signal: "Pipeline active", trend: "Live", tone: "blue" as const };
  if (n.includes("today")) return { icon: "⚡", signal: "Live activity", trend: "Today", tone: "success" as const };
  if (n.includes("client")) return { icon: "👥", signal: "Client base", trend: "+12%", tone: "violet" as const };
  if (n.includes("service")) return { icon: "✂️", signal: "Offer strength", trend: "Ready", tone: "gold" as const };
  if (n.includes("revenue")) return { icon: "💰", signal: "Growth signal", trend: "+18.6%", tone: "gold" as const };
  if (n.includes("booking") || n.includes("appointment")) return { icon: "📅", signal: "Demand pulse", trend: "Live", tone: "blue" as const };

  return { icon: "💎", signal: "Executive signal", trend: "Live", tone: "gold" as const };
}

export default function StatCard({ label, value, variant = "default" }: Props) {
  const meta = getKpiMeta(label);
  const isAccent = variant === "accent";

  return (
    <View style={[styles.card, isAccent && styles.cardAccent]}>
      <View style={styles.glowOrb} />

      <View style={styles.topRow}>
        <View style={[styles.iconWrap, styles[`tone_${meta.tone}`]]}>
          <Text style={styles.icon}>{meta.icon}</Text>
        </View>

        <View style={[styles.trendPill, isAccent && styles.trendPillAccent]}>
          <Text style={[styles.trendText, isAccent && styles.trendTextAccent]}>
            {meta.trend}
          </Text>
        </View>
      </View>

      <Text style={[styles.value, isAccent && styles.valueAccent]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>

      <View style={styles.sparkTrack}>
        <View style={[styles.sparkFill, isAccent && styles.sparkFillAccent]} />
      </View>

      <View style={styles.footerLine}>
        <Text style={styles.signalLabel} numberOfLines={1}>
          {meta.signal}
        </Text>
        <Text style={styles.liveDot}>●</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 150,
    borderRadius: 28,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "rgba(8, 10, 20, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(242, 209, 122, 0.26)",
    boxShadow: UI.depth.card,
    elevation: 14,
  },
  cardAccent: {
    backgroundColor: "rgba(15, 13, 30, 0.94)",
    borderColor: "rgba(196, 161, 255, 0.34)",
  },
  glowOrb: {
    position: "absolute",
    right: -34,
    top: -34,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(245, 210, 122, 0.10)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tone_gold: {
    backgroundColor: "rgba(242, 209, 122, 0.13)",
    borderColor: "rgba(242, 209, 122, 0.30)",
  },
  tone_blue: {
    backgroundColor: "rgba(59, 130, 246, 0.13)",
    borderColor: "rgba(59, 130, 246, 0.30)",
  },
  tone_violet: {
    backgroundColor: "rgba(196, 161, 255, 0.14)",
    borderColor: "rgba(196, 161, 255, 0.32)",
  },
  tone_success: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.28)",
  },
  tone_warning: {
    backgroundColor: "rgba(251, 113, 133, 0.12)",
    borderColor: "rgba(251, 113, 133, 0.30)",
  },
  icon: {
    fontSize: 18,
  },
  trendPill: {
    borderRadius: UI.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(52, 211, 153, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.24)",
  },
  trendPillAccent: {
    backgroundColor: "rgba(196, 161, 255, 0.12)",
    borderColor: "rgba(196, 161, 255, 0.28)",
  },
  trendText: {
    color: "#bbf7d0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  trendTextAccent: {
    color: "#e8ddff",
  },
  value: {
    color: "#f5d27a",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 7,
  },
  valueAccent: {
    color: "#c4a1ff",
  },
  label: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  sparkTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 13,
  },
  sparkFill: {
    width: "72%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#f5d27a",
  },
  sparkFillAccent: {
    width: "58%",
    backgroundColor: "#c4a1ff",
  },
  footerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 10,
  },
  signalLabel: {
    flex: 1,
    color: "rgba(232, 221, 255, 0.72)",
    fontSize: 11,
    fontWeight: "800",
  },
  liveDot: {
    color: "#34d399",
    fontSize: 9,
  },
});
