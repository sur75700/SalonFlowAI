import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function ChartBlock({ title, subtitle, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.chartBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#0a0b10",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.xl,
    marginBottom: UI.spacing.lg,
    borderWidth: 1,
    borderColor: "#302838",
    boxShadow: UI.depth.card,
    elevation: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: UI.font.title,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: UI.font.body,
    lineHeight: 21,
    marginBottom: UI.spacing.md,
  },
  chartBody: {
    marginTop: UI.spacing.xs,
  },
});
