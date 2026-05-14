import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function SectionCard({ title, subtitle, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.overline}>SALONFLOW</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0e121c",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.xl,
    marginBottom: 24,
    borderWidth: 1,
    boxShadow: UI.depth.hero,
    elevation: 10,
    borderColor: "#34283d",
  },
  header: {
    marginBottom: 16,
  },
  overline: {
    color: "#f2d17a",
    fontSize: UI.font.tiny,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: UI.font.title,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: UI.font.body,
    lineHeight: 21,
  },
  body: {
    gap: 10,
  },
});
