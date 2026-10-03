import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";

import { useAppLanguage } from "../../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../../hooks/useDashboardTheme";
import { useToast } from "../../../ui/Toast";
import { createCheckoutSession, createCustomerPortalSession } from "../../../../lib/api";
import { settingsCopy } from "../../../../lib/settings/copy";
import type { BillingPlan, SettingsSnapshot } from "../../../../lib/settings/contracts";
import { SettingsButton, SettingsEmptyState, SettingsFactRow, SettingsNotice, SettingsSectionShell } from "../SettingsPrimitives";

function money(plan: BillingPlan, customPrice: string, perMonth: string): string {
  return plan.monthly_price === null ? customPrice : `${plan.currency} ${plan.monthly_price} / ${perMonth}`;
}

function returnUrl(path: string): string {
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/${path.replace(/^\//, "")}`;
  return ExpoLinking.createURL(path.replace(/^\//, ""));
}

function isAllowedStripeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"));
  } catch {
    return false;
  }
}

export function TeamSettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);

  return (
    <SettingsSectionShell title={copy.sectionLabels.team} subtitle={copy.teamSubtitle}>
      <SettingsFactRow
        label={copy.currentAccountRole}
        value={snapshot.account.user?.role || copy.unavailable}
        state={snapshot.account.user?.role ? "DERIVED" : "NOT_AVAILABLE"}
      />
      <SettingsEmptyState text={copy.teamUnavailable} />
    </SettingsSectionShell>
  );
}

export function BillingSettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const { theme, selectedThemeId } = useDashboardTheme();
  const { showToast } = useToast();
  const copy = settingsCopy(language);
  const settingsAccent = selectedThemeId === "royal_gold_cosmos" ? theme.palette.gold : theme.palette.royal;
  const status = snapshot.billing.status;
  const catalog = snapshot.billingPlans.value;
  const [busy, setBusy] = useState(false);

  const billingReady = Boolean(snapshot.token && status?.billing_ready && catalog?.billing_ready);
  const portalReady = Boolean(snapshot.token && status?.provider === "stripe" && status.billing_ready);

  const openCheckout = async (plan: BillingPlan) => {
    if (!billingReady || !snapshot.token) return;
    try {
      setBusy(true);
      const response = await createCheckoutSession(snapshot.token, plan.code, returnUrl("billing/success"), returnUrl("billing/cancel"));
      if (!isAllowedStripeUrl(response.checkout_url)) throw new Error("Unsafe checkout URL");
      await WebBrowser.openBrowserAsync(response.checkout_url);
      showToast(copy.checkoutOpened, "success");
      await snapshot.billing.refresh();
    } catch {
      showToast(copy.actionFailed, "error");
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    if (!portalReady || !snapshot.token) return;
    try {
      setBusy(true);
      const response = await createCustomerPortalSession(snapshot.token, returnUrl("explore?section=billing"));
      if (!isAllowedStripeUrl(response.portal_url)) throw new Error("Unsafe portal URL");
      await WebBrowser.openBrowserAsync(response.portal_url);
      showToast(copy.portalOpened, "success");
      await snapshot.billing.refresh();
    } catch {
      showToast(copy.actionFailed, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsSectionShell title={copy.sectionLabels.billing} subtitle={copy.billingSubtitle}>
      <View style={styles.billingSectionHeader}>
        <View style={[styles.billingSectionMarker, { backgroundColor: settingsAccent }]} />
        <Text style={[styles.billingSectionTitle, { color: theme.palette.textPrimary }]}>{copy.currentPlanLabel}</Text>
        <View style={[styles.billingSectionRule, { backgroundColor: `${settingsAccent}30` }]} />
      </View>
      {snapshot.billing.loading ? (
        <SettingsNotice state="CACHED" text={copy.loading} />
      ) : status ? (
        <>
          <SettingsFactRow label={copy.currentPlanLabel} value={status.plan.toUpperCase()} state="LIVE" />
          <SettingsFactRow label={copy.subscriptionLifecycle} value={status.status || copy.unavailable} state={status.status ? "LIVE" : "NOT_AVAILABLE"} />
          <SettingsFactRow label={copy.paymentManagement} value={status.billing_ready ? copy.stripeReady : copy.stripeNotReady} state={status.billing_ready ? "CONFIGURED" : "NOT_AVAILABLE"} />
          <SettingsFactRow
            label={copy.subscriptionSource}
            value={status.provider === "stripe" ? copy.connectedViaStripe : copy.organizationAssignedAccess}
            state={status.provider === "stripe" ? "LIVE" : "DERIVED"}
          />
        </>
      ) : (
        <SettingsNotice text={copy.billingNotConfirmed} />
      )}

      {snapshot.billingPlans.loading ? (
        <SettingsNotice state="CACHED" text={copy.loading} />
      ) : catalog ? (
        <View style={{ gap: 10 }}>
          <View style={styles.billingSectionHeader}>
            <View style={[styles.billingSectionMarker, { backgroundColor: settingsAccent }]} />
            <Text style={[styles.billingSectionTitle, { color: theme.palette.textPrimary }]}>{copy.availablePlans}</Text>
            <View style={[styles.billingSectionRule, { backgroundColor: `${settingsAccent}30` }]} />
          </View>
          {catalog.plans.map((plan) => {
            const isCurrent = plan.code === status?.plan;
            const canCheckout = billingReady && !isCurrent && plan.monthly_price !== null && plan.monthly_price > 0;
            const actionLabel = isCurrent ? `${plan.name} · ${copy.current}` : `${copy.changePlan}: ${plan.name}`;

            return (
              <View
                key={plan.code}
                style={[
                  styles.planCard,
                  {
                    borderColor: isCurrent ? `${settingsAccent}88` : theme.palette.border,
                    backgroundColor: isCurrent ? `${settingsAccent}08` : "transparent",
                  },
                ]}
              >
                <SettingsFactRow
                  label={plan.name}
                  value={money(plan, copy.customPrice, copy.perMonth)}
                  state={isCurrent ? "LIVE" : "CONFIGURED"}
                  detail={`${plan.features.length} ${copy.catalogEntitlements}`}
                />
                <SettingsButton
                  label={actionLabel}
                  onPress={() => void openCheckout(plan)}
                  disabled={busy || !canCheckout}
                />
              </View>
            );
          })}
        </View>
      ) : snapshot.billingPlans.state === "ERROR" ? (
        <>
          <SettingsNotice state="ERROR" text={copy.actionFailed} />
          <SettingsButton label={copy.retry} onPress={() => void snapshot.billingPlans.refresh()} />
        </>
      ) : null}

      <View style={{ gap: 10 }}>
        <View style={styles.billingSectionHeader}>
          <View style={[styles.billingSectionMarker, { backgroundColor: settingsAccent }]} />
          <Text style={[styles.billingSectionTitle, { color: theme.palette.textPrimary }]}>{copy.subscriptionActions}</Text>
          <View style={[styles.billingSectionRule, { backgroundColor: `${settingsAccent}30` }]} />
        </View>

        <SettingsFactRow
          label={copy.manageSubscription}
          value={portalReady ? copy.connectedViaStripe : copy.stripeNotReady}
          state={portalReady ? "LIVE" : "NOT_AVAILABLE"}
          detail={copy.manageSubscriptionDetail}
        />
        <SettingsButton label={copy.manageSubscription} onPress={() => void openPortal()} disabled={busy || !portalReady} />

        <SettingsFactRow
          label={copy.paymentMethods}
          value={portalReady ? copy.connectedViaStripe : copy.stripeNotReady}
          state={portalReady ? "LIVE" : "NOT_AVAILABLE"}
          detail={copy.paymentMethodsDetail}
        />
        <SettingsButton label={copy.paymentMethods} onPress={() => void openPortal()} disabled={busy || !portalReady} />

        {!portalReady ? <SettingsNotice text={copy.billingActionsUnavailable} /> : null}
      </View>

      <SettingsNotice state="DERIVED" text={copy.paymentPendingNote} />
      <SettingsButton label={copy.refresh} onPress={() => void snapshot.billing.refresh()} disabled={snapshot.billing.loading || busy} />
    </SettingsSectionShell>
  );
}


const styles = StyleSheet.create({
  billingSectionHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 4 },
  billingSectionMarker: { width: 3, height: 16, borderRadius: 999 },
  billingSectionTitle: { fontSize: 14, lineHeight: 20, fontWeight: "900", letterSpacing: 0.1 },
  billingSectionRule: { flex: 1, height: StyleSheet.hairlineWidth, minWidth: 24 },
  planCard: { gap: 8, borderWidth: 1, borderRadius: 18, padding: 10 },
});
