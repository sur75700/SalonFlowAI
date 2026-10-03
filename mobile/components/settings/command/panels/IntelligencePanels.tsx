import { View } from "react-native";

import { useAppLanguage } from "../../../../contexts/LanguageContext";
import { settingsCopy } from "../../../../lib/settings/copy";
import type { SettingsSnapshot } from "../../../../lib/settings/contracts";
import { SettingsFactRow, SettingsNotice, SettingsSectionShell } from "../SettingsPrimitives";

const AI_FEATURES = [
  "ai_forecast", "growth_insights", "risk_center", "client_intelligence", "mission_control",
  "performance_center", "benchmark_center", "revenue_simulator", "opportunity_matrix", "advanced_ai",
] as const;

function label(code: string): string {
  return code.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function AISettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  const features = snapshot.billing.status?.features ?? null;

  return (
    <SettingsSectionShell title={copy.sectionLabels.intelligence} subtitle={copy.aiSubtitle}>
      {features ? (
        <View style={{ gap: 2 }}>
          {AI_FEATURES.map((code) => {
            const included = features.includes(code);
            return (
              <SettingsFactRow
                key={code}
                label={label(code)}
                value={included ? copy.livePlanEntitlement : copy.notIncludedInPlan}
                state={included ? "DERIVED" : "PLAN_RESTRICTED"}
                detail={included ? copy.planAccessAvailable : undefined}
              />
            );
          })}
        </View>
      ) : (
        <SettingsNotice text={copy.billingNotConfirmed} />
      )}
      <SettingsNotice state="DERIVED" text={copy.aiRuntimeDoctrine} />
    </SettingsSectionShell>
  );
}

export function AIUsageSettingsPanel() {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);

  return (
    <SettingsSectionShell title={copy.sectionLabels.governance} subtitle={copy.governanceSubtitle}>
      <SettingsNotice text={copy.usageUnavailable} />
      <SettingsFactRow
        label={copy.humanAuthorization}
        value={copy.humanAuthorizationRequired}
        state="DERIVED"
        detail={copy.humanAuthorizationDetail}
      />
      <SettingsFactRow label={copy.usageCounters} value={copy.unavailable} state="NOT_AVAILABLE" />
      <SettingsFactRow label={copy.estimatedAiCost} value={copy.unavailable} state="NOT_AVAILABLE" />
      <SettingsFactRow label={copy.efficiencyScore} value={copy.unavailable} state="NOT_AVAILABLE" />
    </SettingsSectionShell>
  );
}
