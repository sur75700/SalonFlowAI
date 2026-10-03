import type { SettingsSectionId, SettingsSnapshot } from "../../../lib/settings/contracts";
import { settingsCopy } from "../../../lib/settings/copy";
import { useAppLanguage } from "../../../contexts/LanguageContext";
import SettingsExecutiveOverview from "./SettingsExecutiveOverview";
import { AccountSettingsPanel, AppearanceSettingsPanel, WorkspaceSettingsPanel } from "./panels/CorePanels";
import { DangerZonePanel, PrivacySettingsPanel, SecuritySettingsPanel } from "./panels/ProtectionPanels";
import { BillingSettingsPanel, TeamSettingsPanel } from "./panels/BusinessPanels";
import { AISettingsPanel, AIUsageSettingsPanel } from "./panels/IntelligencePanels";
import { AuditSettingsPanel, GhostStageAuthorityPanel, IntegrationsSettingsPanel, NotificationsSettingsPanel, SystemStatusSettingsPanel } from "./panels/ConnectionTrustPanels";
import { SettingsNotice, SettingsSectionShell } from "./SettingsPrimitives";

export default function SettingsPanelRouter({ selected, snapshot, onSelect }: { selected: SettingsSectionId; snapshot: SettingsSnapshot; onSelect: (id: SettingsSectionId) => void }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  switch (selected) {
    case "overview": return <SettingsExecutiveOverview snapshot={snapshot} onSelect={onSelect} />;
    case "account": return <AccountSettingsPanel snapshot={snapshot} />;
    case "workspace": return <WorkspaceSettingsPanel snapshot={snapshot} />;
    case "appearance": return <AppearanceSettingsPanel />;
    case "security": return <SecuritySettingsPanel snapshot={snapshot} />;
    case "privacy": return <PrivacySettingsPanel />;
    case "team": return <TeamSettingsPanel snapshot={snapshot} />;
    case "billing": return <BillingSettingsPanel snapshot={snapshot} />;
    case "intelligence": return <AISettingsPanel snapshot={snapshot} />;
    case "governance": return <AIUsageSettingsPanel />;
    case "notifications": return <NotificationsSettingsPanel />;
    case "integrations": return <IntegrationsSettingsPanel snapshot={snapshot} />;
    case "status": return <SystemStatusSettingsPanel snapshot={snapshot} />;
    case "audit": return <AuditSettingsPanel />;
    case "authority": return <GhostStageAuthorityPanel />;
    case "danger": return <DangerZonePanel />;
    default: return <SettingsSectionShell title={copy.unavailable}><SettingsNotice text={copy.unavailable} /></SettingsSectionShell>;
  }
}
