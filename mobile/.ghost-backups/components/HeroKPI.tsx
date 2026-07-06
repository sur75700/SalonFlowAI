import React from "react";
import { View, Text } from "react-native";

export default function HeroKPI({ title, value, trend }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.trend}>{trend}</Text>
    </View>
  );
}

const styles = {
  container: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  title: {
    fontSize: 13,
    opacity: 0.7,
  },
  value: {
    fontSize: 34,
    fontWeight: "700" as const,
    marginTop: 6,
  },
  trend: {
    marginTop: 6,
    color: "#4ade80",
    fontSize: 13,
  },
};
