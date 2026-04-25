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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  scheduled: {
    backgroundColor: "#1d4ed8",
  },
  completed: {
    backgroundColor: "#15803d",
  },
  cancelled: {
    backgroundColor: "#b91c1c",
  },
  active: {
    backgroundColor: "#166534",
  },
  inactive: {
    backgroundColor: "#6b7280",
  },
  text: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
