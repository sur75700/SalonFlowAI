import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { UI } from "../../lib/theme/tokens";

const kpis = [
  { label: "Revenue", value: "€12,450", trend: "↗ +18.6%", tone: "gold" },
  { label: "Appointments", value: "128", trend: "Live demand", tone: "blue" },
  { label: "New Clients", value: "35", trend: "↗ +12.4%", tone: "violet" },
  { label: "AI Score", value: "94/100", trend: "Excellent", tone: "green" },
] as const;

export default function DashboardV2() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.badge}>ROYAL COSMOS COMMAND CENTER</Text>
        <Text style={styles.title}>Good Evening, Suren 👋</Text>
        <Text style={styles.subtitle}>
          Your salon is operating beautifully. AI is watching revenue, bookings,
          clients, empty slots, and tomorrow’s growth signals.
        </Text>

        <View style={styles.heroStats}>
          <View>
            <Text style={styles.heroStatLabel}>TODAY REVENUE</Text>
            <Text style={styles.heroStatValue}>€12,450</Text>
          </View>
          <View style={styles.heroAiPill}>
            <Text style={styles.heroAiLabel}>AI SCORE</Text>
            <Text style={styles.heroAiValue}>94/100</Text>
          </View>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        {kpis.map((item) => (
          <View key={item.label} style={styles.kpiCard}>
            <View style={[styles.kpiOrb, styles[`orb_${item.tone}`]]} />
            <Text style={styles.kpiLabel}>{item.label}</Text>
            <Text style={styles.kpiValue}>{item.value}</Text>
            <Text style={styles.kpiTrend}>{item.trend}</Text>
            <View style={styles.kpiTrack}>
              <View style={[styles.kpiFill, styles[`fill_${item.tone}`]]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.revenuePanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelLabel}>REVENUE OVERVIEW</Text>
            <Text style={styles.panelTitle}>€124,580</Text>
          </View>
          <Text style={styles.panelPill}>MONTH</Text>
        </View>

        <View style={styles.chartBox}>
          <View style={styles.chartLineOne} />
          <View style={styles.chartLineTwo} />
          <View style={styles.chartLineThree} />
        </View>
      </View>

      <View style={styles.aiPanel}>
        <Text style={styles.panelLabel}>AI COMMAND CENTER</Text>
        <Text style={styles.panelTitle}>Today’s Focus</Text>

        {[
          "2 premium appointment slots still open",
          "VIP client likely to return this week",
          "Revenue forecast is trending +12%",
          "Best marketing window: 17:00–19:00",
        ].map((text) => (
          <View key={text} style={styles.aiRow}>
            <Text style={styles.aiDot}>✦</Text>
            <Text style={styles.aiText}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 18,
    paddingBottom: UI.spacing.bottom,
    gap: 18,
  },
  hero: {
    minHeight: 318,
    borderRadius: 34,
    padding: 24,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: "rgba(5,8,22,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    boxShadow: UI.depth.hero,
  },
  heroGlow: {
    position: "absolute",
    right: -90,
    top: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(59,130,246,0.18)",
  },
  badge: {
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 38,
    lineHeight: 43,
    fontWeight: "900",
    letterSpacing: -1.3,
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(236,244,255,0.76)",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 760,
  },
  heroStats: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
  },
  heroStatLabel: {
    color: "rgba(220,232,255,0.58)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  heroAiPill: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    minWidth: 112,
  },
  heroAiLabel: {
    color: "rgba(220,232,255,0.58)",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroAiValue: {
    color: "#34d399",
    fontSize: 18,
    fontWeight: "900",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: 160,
    minHeight: 178,
    borderRadius: 30,
    padding: 19,
    overflow: "hidden",
    backgroundColor: "rgba(8,11,24,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  kpiOrb: {
    position: "absolute",
    right: -34,
    top: -34,
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  orb_gold: { backgroundColor: "rgba(245,210,122,0.13)" },
  orb_blue: { backgroundColor: "rgba(59,130,246,0.14)" },
  orb_violet: { backgroundColor: "rgba(168,85,247,0.14)" },
  orb_green: { backgroundColor: "rgba(52,211,153,0.12)" },
  kpiLabel: {
    color: "rgba(220,232,255,0.60)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 18,
  },
  kpiValue: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 8,
  },
  kpiTrend: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 20,
  },
  kpiTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  kpiFill: {
    width: "74%",
    height: "100%",
    borderRadius: 999,
  },
  fill_gold: { backgroundColor: "#f5d27a" },
  fill_blue: { backgroundColor: "#3b82f6" },
  fill_violet: { backgroundColor: "#a855f7" },
  fill_green: { backgroundColor: "#34d399" },
  revenuePanel: {
    minHeight: 260,
    borderRadius: 34,
    padding: 22,
    backgroundColor: "rgba(6,10,25,0.92)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.16)",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  panelLabel: {
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  panelTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  panelPill: {
    color: "#bfdbfe",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.22)",
  },
  chartBox: {
    height: 132,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 18,
  },
  chartLineOne: {
    height: 7,
    width: "84%",
    borderRadius: 999,
    backgroundColor: "#3b82f6",
  },
  chartLineTwo: {
    height: 7,
    width: "64%",
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.54)",
  },
  chartLineThree: {
    height: 7,
    width: "74%",
    borderRadius: 999,
    backgroundColor: "rgba(245,210,122,0.68)",
  },
  aiPanel: {
    minHeight: 230,
    borderRadius: 34,
    padding: 22,
    backgroundColor: "rgba(17,13,33,0.94)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.18)",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  aiDot: {
    color: "#c4a1ff",
    fontSize: 13,
    marginTop: 1,
  },
  aiText: {
    flex: 1,
    color: "rgba(236,244,255,0.76)",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
});
