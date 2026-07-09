import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { UI } from "../../lib/theme/tokens";

export default function DashboardV2() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.badge}>ROYAL COSMOS V2</Text>
        <Text style={styles.title}>Good Evening, Suren 👋</Text>
        <Text style={styles.subtitle}>
          One premium command center for revenue, bookings, clients, AI signals, and daily salon growth.
        </Text>
      </View>

      <View style={styles.kpiGrid}>
        {[
          ["Revenue", "€12,450", "↗ +18.6%"],
          ["Appointments", "128", "Live demand"],
          ["New Clients", "35", "↗ +12.4%"],
          ["AI Score", "94/100", "Excellent"],
        ].map(([label, value, signal]) => (
          <View key={label} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{label}</Text>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiSignal}>{signal}</Text>
            <View style={styles.kpiLine} />
          </View>
        ))}
      </View>

      <View style={styles.widePanel}>
        <Text style={styles.panelLabel}>REVENUE OVERVIEW</Text>
        <Text style={styles.panelTitle}>€124,580</Text>
        <Text style={styles.panelText}>Premium chart reconstruction zone.</Text>
      </View>

      <View style={styles.aiPanel}>
        <Text style={styles.panelLabel}>AI COMMAND CENTER</Text>
        <Text style={styles.panelTitle}>Today’s Focus</Text>
        <Text style={styles.panelText}>
          Revenue forecast, busy hours, VIP clients, empty slots, and recommended actions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 18,
    paddingBottom: UI.spacing.bottom,
    gap: 16,
  },
  hero: {
    minHeight: 250,
    borderRadius: 32,
    padding: 24,
    justifyContent: "flex-end",
    backgroundColor: "rgba(7,10,26,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    boxShadow: UI.depth.hero,
  },
  badge: {
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(236,244,255,0.74)",
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 760,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: 160,
    minHeight: 154,
    borderRadius: 28,
    padding: 18,
    backgroundColor: "rgba(9,12,26,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  kpiLabel: {
    color: "rgba(220,232,255,0.64)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  kpiValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  kpiSignal: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 18,
  },
  kpiLine: {
    height: 5,
    width: "76%",
    borderRadius: 999,
    backgroundColor: "#3b82f6",
  },
  widePanel: {
    minHeight: 220,
    borderRadius: 30,
    padding: 22,
    backgroundColor: "rgba(8,12,28,0.9)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.22)",
  },
  aiPanel: {
    minHeight: 190,
    borderRadius: 30,
    padding: 22,
    backgroundColor: "rgba(18,14,34,0.9)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.22)",
  },
  panelLabel: {
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  panelTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  panelText: {
    color: "rgba(236,244,255,0.68)",
    fontSize: 13,
    lineHeight: 20,
  },
});
