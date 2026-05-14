import React from "react";
import { UI } from "../../lib/theme/tokens";
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
    width: "48%",
    minWidth: 160,
      maxWidth: 260,
    backgroundColor: "#0a0b10",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.xl,
    borderWidth: 1,
    boxShadow: UI.depth.card,
    elevation: 10,
    borderColor: "#2a2230",
  },
  cardAccent: {
    backgroundColor: "#11101b",
    borderColor: "#4c3575",
  },
  value: {
    color: "#f5d27a",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 7,
  },
  valueAccent: {
    color: "#c4a1ff",
    fontSize: 26,
  },
  label: {
    color: "#c1b4c7",
    fontSize: UI.font.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
});
