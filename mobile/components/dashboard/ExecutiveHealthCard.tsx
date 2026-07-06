import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { UI } from "../../lib/theme/tokens";

type Props = {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
};

export default function ExecutiveHealthCard({
  icon,
  title,
  value,
  subtitle,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: 160,
    backgroundColor: "rgba(12,14,22,0.90)",
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    borderColor: "rgba(242,209,122,0.22)",
    padding: UI.spacing.md,
    boxShadow: UI.depth.card,
    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  icon: {
    fontSize: 18,
  },

  title: {
    flex: 1,
    color: "#f5d27a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  value: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
  },

  subtitle: {
    color: "#bdb6c8",
    fontSize: 12,
    lineHeight: 18,
  },
});
