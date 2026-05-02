import React from "react";
import { StyleSheet, Text, View } from "react-native";

import ActionButton from "../dashboard/ActionButton";

type SessionActionBarProps = {
  email?: string;
  onLogout: () => void;
  loggingOut?: boolean;
};

export default function SessionActionBar({
  email,
  onLogout,
  loggingOut = false,
}: SessionActionBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.info}>
        <Text style={styles.label}>SESSION</Text>
        <Text style={styles.title}>Admin Session Active</Text>
        <Text style={styles.subtitle}>
          {email ? `Authorized as ${email}` : "Authorized inside SalonFlow AI admin"}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          title={loggingOut ? "Closing Session..." : "Close Session"}
          onPress={onLogout}
          disabled={loggingOut}
          tone="danger"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#232834",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  info: {
    gap: 4,
  },
  label: {
    color: "#f2d17a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: "#c9c2cf",
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
