import React from "react";
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
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: "#f2d17a",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 7,
    textAlign: "center",
  },
  subtitle: {
    color: "#b8b0c0",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
