import React from "react";
import { StyleSheet, Text, View } from "react-native";

type StatusTone = "scheduled" | "completed" | "cancelled" | "active" | "inactive";

type Props = {
  status: string;
};

function normalizeStatus(status: string): StatusTone {
  const value = (status || "").toLowerCase();

  if (value === "completed") return "completed";
  if (value === "cancelled") return "cancelled";
  if (value === "active") return "active";
  if (value === "inactive") return "inactive";
  return "scheduled";
}

export default function StatusBadge({ status }: Props) {
  const tone = normalizeStatus(status);

  return (
    <View
      style={[
        styles.base,
        tone === "scheduled" && styles.scheduled,
        tone === "completed" && styles.completed,
        tone === "cancelled" && styles.cancelled,
        tone === "active" && styles.active,
        tone === "inactive" && styles.inactive,
      ]}
    >
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  scheduled: {
    backgroundColor: "#172554",
    borderColor: "#3b82f6",
  },
  completed: {
    backgroundColor: "#052e16",
    borderColor: "#22c55e",
  },
  cancelled: {
    backgroundColor: "#450a0a",
    borderColor: "#ef4444",
  },
  active: {
    backgroundColor: "#052e16",
    borderColor: "#22c55e",
  },
  inactive: {
    backgroundColor: "#1f2937",
    borderColor: "#6b7280",
  },
  text: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
});
