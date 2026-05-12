import React from "react";
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
    backgroundColor: "#0a0b10",
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2230",
  },
  header: {
    marginBottom: 16,
  },
  overline: {
    color: "#f2d17a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: 14,
    lineHeight: 21,
  },
  body: {
    gap: 10,
  },
});
