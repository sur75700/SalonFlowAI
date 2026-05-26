import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

type SessionStatusBannerProps = {
  title: string;
  subtitle: string;
};

export default function SessionStatusBanner({
  title,
  subtitle,
}: SessionStatusBannerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#141b30",
    borderWidth: 1,
    borderColor: "#2c4d8f",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    marginBottom: UI.spacing.md,
    boxShadow: UI.depth.soft,
    elevation: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: UI.font.subtitle,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#ced7f5",
    fontSize: UI.font.body,
    lineHeight: 20,
  },
});
