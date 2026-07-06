import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { UI } from "../../lib/theme/tokens";

export default function ExecutiveSnapshot({
  summary,
}: {
  summary?: any;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Executive Snapshot</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Business Health</Text>
        <Text style={styles.value}>🟢 Healthy</Text>
        <Text style={styles.sub}>
          {summary?.completed_appointments ?? 0} completed ·{" "}
          {summary?.cancelled_appointments ?? 0} attention
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Revenue</Text>
        <Text style={styles.value}>
          {summary?.revenue ?? 0}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Bookings</Text>
        <Text style={styles.value}>
          {summary?.total_appointments ?? 0}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Clients</Text>
        <Text style={styles.value}>
          {summary?.total_clients ?? 0}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 16,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "rgba(10,11,16,0.85)",
    borderRadius: UI.radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  label: {
    color: "#f5d27a",
    fontSize: 11,
    fontWeight: "800",
  },

  value: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },

  sub: {
    color: "#b8b0c5",
    fontSize: 11,
    marginTop: 6,
  },
});
