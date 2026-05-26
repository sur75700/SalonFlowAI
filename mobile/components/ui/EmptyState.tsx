import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
};

export default function EmptyState({
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>✦</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(16, 19, 26, 0.84)",
    borderWidth: 1,
    borderColor: "#2b3040",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: UI.depth.soft,
    elevation: 6,
  },
  icon: {
    color: "#f2d17a",
    fontSize: UI.font.title,
    fontWeight: "900",
    marginBottom: UI.spacing.xs,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: UI.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    color: "#b8b0c0",
    fontSize: UI.font.subtitle,
    lineHeight: 22,
    textAlign: "center",
  },
});
