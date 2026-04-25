import React from "react";
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
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "#ced7f5",
    fontSize: 14,
    lineHeight: 20,
  },
});
