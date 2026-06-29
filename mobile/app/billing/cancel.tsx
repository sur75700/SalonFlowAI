import React, { useEffect } from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useBilling } from "../../contexts/BillingContext";
import { UI } from "../../lib/theme/tokens";

export default function BillingCancelScreen() {
  const { refreshBilling, currentPlan } = useBilling();

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.badge}>BILLING CANCELLED</Text>
        <Text style={styles.title}>Checkout was cancelled</Text>
        <Text style={styles.subtitle}>
          No billing changes were completed. Your current plan remains {currentPlan.toUpperCase()}.
        </Text>

        <Link href="/(tabs)/explore" style={styles.link}>
          Back to Settings
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#08090d",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 22,
  },
  badge: {
    color: "#f2d17a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  link: {
    color: "#f2d17a",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 20,
  },
});
