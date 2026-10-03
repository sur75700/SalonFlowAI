import { Text, View } from "react-native";

import { useAppLanguage } from "../../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../../hooks/useDashboardTheme";
import { settingsCopy } from "../../../../lib/settings/copy";
import type { SettingsSnapshot } from "../../../../lib/settings/contracts";
import { SettingsButton, SettingsEmptyState, SettingsFactRow, SettingsNotice, SettingsSectionShell } from "../SettingsPrimitives";

export function NotificationsSettingsPanel() {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);

  return (
    <SettingsSectionShell title={copy.sectionLabels.notifications} subtitle={copy.notificationsSubtitle}>
      <SettingsNotice text={copy.notificationUnavailable} />
      {["Email", "SMS", "Push", "WhatsApp"].map((channel) => (
        <SettingsFactRow
          key={channel}
          label={channel}
          value={copy.channelUnavailable}
          state="NOT_AVAILABLE"
        />
      ))}
    </SettingsSectionShell>
  );
}

export function IntegrationsSettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  const billing = snapshot.billing.status;
  const stripeState =
    billing?.provider === "stripe"
      ? "LIVE"
      : snapshot.billingPlans.value?.billing_ready
        ? "CONFIGURED"
        : "NOT_AVAILABLE";
  const stripeValue =
    billing?.provider === "stripe"
      ? copy.connectedViaStripe
      : snapshot.billingPlans.value?.billing_ready
        ? copy.stripeReady
        : copy.stripeNotReady;

  return (
    <SettingsSectionShell title={copy.sectionLabels.integrations} subtitle={copy.integrationsSubtitle}>
      <SettingsFactRow label="Stripe" value={stripeValue} state={stripeState} />
      {["Google Calendar", "WhatsApp Business", "Instagram", "Zapier", "Make", "n8n", "Webhook API"].map((provider) => (
        <SettingsFactRow
          key={provider}
          label={provider}
          value={copy.integrationUnavailable}
          state="NOT_AVAILABLE"
        />
      ))}
    </SettingsSectionShell>
  );
}

export function SystemStatusSettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  const resource = snapshot.backendHealth;

  return (
    <SettingsSectionShell title={copy.sectionLabels.status} subtitle={copy.statusSubtitle}>
      {resource.loading ? (
        <SettingsNotice state="CACHED" text={copy.loading} />
      ) : resource.value?.status === "ok" ? (
        <SettingsFactRow
          label={copy.backendApiLabel}
          value={copy.operational}
          state="LIVE"
          detail={resource.observedAt ? `${copy.checkedAt} ${resource.observedAt}` : undefined}
        />
      ) : resource.state === "ERROR" ? (
        <>
          <SettingsNotice state="ERROR" text={copy.actionFailed} />
          <SettingsButton label={copy.retry} onPress={() => void resource.refresh()} />
        </>
      ) : (
        <SettingsNotice text={copy.noOperationalTelemetry} />
      )}

      <SettingsFactRow
        label={copy.featureAvailability}
        value={copy.seeRelevantSection}
        state="DERIVED"
      />
      <SettingsFactRow
        label={copy.integrationReadiness}
        value={copy.seeRelevantSection}
        state="DERIVED"
      />
      <SettingsFactRow
        label={copy.configurationCompleteness}
        value={copy.seeRelevantSection}
        state="DERIVED"
      />
      <SettingsNotice text={copy.noOperationalTelemetry} />
    </SettingsSectionShell>
  );
}

export function AuditSettingsPanel() {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);

  return (
    <SettingsSectionShell title={copy.sectionLabels.audit} subtitle={copy.auditSubtitle}>
      <SettingsEmptyState text={copy.auditUnavailable} />
    </SettingsSectionShell>
  );
}

export function GhostStageAuthorityPanel() {
  const { language } = useAppLanguage();
  const { theme } = useDashboardTheme();
  const copy = settingsCopy(language);

  return (
    <SettingsSectionShell title={copy.sectionLabels.authority} subtitle={copy.authoritySubtitle}>
      <SettingsFactRow label={copy.productLabel} value="SalonFlowAI" state="CONFIGURED" />
      <SettingsFactRow label={copy.engineeringLabel} value="GhostStage" state="CONFIGURED" />

      <View style={{ gap: 10, marginTop: 4 }}>
        <Text style={{ color: theme.palette.textPrimary, fontWeight: "900", fontSize: 15 }}>
          {copy.engineeringPrinciples}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {copy.authorityPrinciples.map((principle, index) => (
            <View
              key={`${index}-${principle.slice(0, 12)}`}
              style={{
                flexGrow: 1,
                flexBasis: 280,
                minWidth: 220,
                borderWidth: 1,
                borderColor: theme.palette.border,
                backgroundColor: theme.palette.surfaceRaised,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: theme.palette.textSecondary, lineHeight: 20, fontWeight: "700" }}>
                {principle}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <SettingsFactRow label={copy.releaseIdentity} value={copy.releaseUnavailable} state="NOT_AVAILABLE" />
      <SettingsFactRow label={copy.supportDocumentation} value={copy.supportUnavailable} state="NOT_AVAILABLE" />
    </SettingsSectionShell>
  );
}
