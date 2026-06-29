import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useBilling } from "../../contexts/BillingContext";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { readStoredToken } from "../../lib/api";
import { t } from "../../lib/i18n";
import type { PricingPlanCode } from "../../lib/pricing/plans";
import { UI } from "../../lib/theme/tokens";

const PLAN_OPTIONS: PricingPlanCode[] = ["free", "pro", "business", "enterprise"];

function formatPlanName(plan: PricingPlanCode): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export default function BillingCenter() {
  const { locale } = useAppPreferences();
  const {
    billingStatus,
    billingLoading,
    currentPlan,
    refreshBilling,
    updateBillingPlan,
  } = useBilling();

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const enabledFeatures = billingStatus?.features?.length ?? 0;

  const handleRefresh = async () => {
    setActionError("");
    setActionSuccess("");

    await refreshBilling();
    setActionSuccess("Billing status refreshed");
  };

  const handlePlanChange = async (plan: PricingPlanCode) => {
    setActionError("");
    setActionSuccess("");

    try {
      const token = readStoredToken();

      if (!token) {
        setActionError("Active session token is required");
        return;
      }

      await updateBillingPlan(plan, token);
      setActionSuccess(`Plan changed to ${formatPlanName(plan)}`);
    } catch {
      setActionError("Failed to update billing plan");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>💳 {t("Billing Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("Billing Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>{formatPlanName(currentPlan)}</Text>
        <Text style={styles.summaryLabel}>
          {billingStatus?.status || t("Billing Status Pending", locale)}
        </Text>
      </View>

      <View style={styles.itemList}>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Provider</Text>
          <Text style={styles.itemValue}>{billingStatus?.provider || "internal"}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Source</Text>
          <Text style={styles.itemValue}>{billingStatus?.source || "pending"}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Enabled Features</Text>
          <Text style={styles.itemValue}>{enabledFeatures}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Billing Ready</Text>
          <Text style={styles.itemValue}>
            {billingStatus?.billing_ready ? "Ready" : "Foundation mode"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Internal plan switch</Text>

      <View style={styles.planGrid}>
        {PLAN_OPTIONS.map((plan) => {
          const selected = plan === currentPlan;

          return (
            <Pressable
              key={plan}
              onPress={() => handlePlanChange(plan)}
              disabled={billingLoading || selected}
              style={[
                styles.planButton,
                selected ? styles.planButtonActive : null,
                billingLoading ? styles.disabledButton : null,
              ]}
            >
              <Text style={[styles.planButtonText, selected ? styles.planButtonTextActive : null]}>
                {formatPlanName(plan)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleRefresh}
        disabled={billingLoading}
        style={[styles.refreshButton, billingLoading ? styles.disabledButton : null]}
      >
        <Text style={styles.refreshButtonText}>
          {billingLoading ? "Refreshing..." : "Refresh billing status"}
        </Text>
      </Pressable>

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
      {actionSuccess ? <Text style={styles.successText}>{actionSuccess}</Text> : null}

      <Text style={styles.note}>{t("Billing Foundation Note", locale)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.86)",
    borderRadius: UI.radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  overline: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: "rgba(242,209,122,0.12)",
    borderWidth: 1,
    borderColor: "#f2d17a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  itemList: {
    gap: 10,
  },
  itemRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  itemLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  itemValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 10,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  planButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  planButtonActive: {
    borderColor: "#f2d17a",
    backgroundColor: "rgba(242,209,122,0.16)",
  },
  planButtonText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
  },
  planButtonTextActive: {
    color: "#f2d17a",
  },
  refreshButton: {
    borderRadius: 14,
    backgroundColor: "#f2d17a",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  refreshButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  successText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
