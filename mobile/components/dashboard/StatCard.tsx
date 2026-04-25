import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string | number;
  variant?: "default" | "accent";
};

export default function StatCard({
  label,
  value,
  variant = "default",
}: Props) {
  return (
    <View style={[styles.card, variant === "accent" && styles.cardAccent]}>
      <Text style={[styles.value, variant === "accent" && styles.valueAccent]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "31%",
    minWidth: 120,
    backgroundColor: "#0a0b10",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#241f27",
  },
  cardAccent: {
    borderColor: "#2a2440",
  },
  value: {
    color: "#f5d27a",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
  },
  valueAccent: {
    color: "#c4a1ff",
    fontSize: 24,
  },
  label: {
    color: "#c1b4c7",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
