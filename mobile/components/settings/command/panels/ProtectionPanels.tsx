import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { useToast } from "../../../ui/Toast";
import { useAppLanguage } from "../../../../contexts/LanguageContext";
import { useLogout } from "../../../../hooks/useLogout";
import { changePassword } from "../../../../lib/api";
import { getErrorMessage } from "../../../../lib/errors";
import { settingsCopy } from "../../../../lib/settings/copy";
import type { SettingsSnapshot } from "../../../../lib/settings/contracts";
import { useDashboardTheme } from "../../../../hooks/useDashboardTheme";
import { SettingsButton, SettingsFactRow, SettingsNotice, SettingsSectionShell } from "../SettingsPrimitives";

export function SecuritySettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const { theme } = useDashboardTheme();
  const { showToast } = useToast();
  const copy = settingsCopy(language);
  const user = snapshot.account.user;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const clear = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  useEffect(() => {
    clear();
    setEditing(false);
  }, [snapshot.token]);

  const submit = async () => {
    if (!snapshot.token) return showToast(copy.sessionRequired, "error");
    if (!currentPassword || !newPassword || !confirmPassword) return showToast(copy.passwordFieldsRequired, "error");
    if (newPassword.length < 8) return showToast(copy.passwordMinLength, "error");
    if (newPassword !== confirmPassword) return showToast(copy.passwordsMismatch, "error");

    try {
      setBusy(true);
      await changePassword(snapshot.token, currentPassword, newPassword);
      showToast(copy.passwordChanged, "success");
      clear();
      setEditing(false);
    } catch (error) {
      showToast(getErrorMessage(error, copy.actionFailed), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsSectionShell title={copy.sectionLabels.security} subtitle={copy.securitySubtitle}>
      <SettingsFactRow
        label={copy.emailVerificationLabel}
        value={user ? (user.email_verified ? copy.verified : copy.notVerified) : copy.unavailable}
        state={user ? "LIVE" : "NOT_AVAILABLE"}
      />
      <SettingsFactRow
        label={copy.passwordLabel}
        value={copy.passwordChangeSupported}
        state="LIVE"
        detail={copy.passwordDetail}
      />
      <SettingsNotice text={copy.advancedSecurityUnavailable} />
      <SettingsButton
        label={editing ? copy.cancel : copy.changePassword}
        onPress={() => {
          clear();
          setEditing((value) => !value);
        }}
        disabled={busy}
      />

      {editing ? (
        <View style={{ gap: 10 }}>
          {[
            [copy.currentPassword, currentPassword, setCurrentPassword],
            [copy.newPassword, newPassword, setNewPassword],
            [copy.confirmNewPassword, confirmPassword, setConfirmPassword],
          ].map(([placeholder, value, setter]) => (
            <TextInput
              key={placeholder as string}
              accessibilityLabel={placeholder as string}
              secureTextEntry
              value={value as string}
              onChangeText={setter as (value: string) => void}
              placeholder={placeholder as string}
              placeholderTextColor={theme.palette.textTertiary}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: theme.palette.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                color: theme.palette.textPrimary,
                backgroundColor: theme.palette.surfaceRaised,
              }}
            />
          ))}
          <SettingsButton
            label={busy ? copy.loading : copy.updatePassword}
            onPress={() => void submit()}
            disabled={busy}
          />
        </View>
      ) : null}
    </SettingsSectionShell>
  );
}

export function PrivacySettingsPanel() {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);

  return (
    <SettingsSectionShell title={copy.sectionLabels.privacy} subtitle={copy.privacySubtitle}>
      <SettingsNotice text={copy.privacyUnavailable} />
      <SettingsFactRow label={copy.operationalReports} value={copy.availableInReports} state="CONFIGURED" detail={copy.reportsNotExport} />
      <SettingsFactRow
        label={copy.workspaceIsolation}
        value={copy.serverScopedPrinciple}
        state="DERIVED"
        detail={copy.workspaceIsolationDetail}
      />
    </SettingsSectionShell>
  );
}

export function DangerZonePanel() {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  const { logout, loggingOut } = useLogout();
  const [confirming, setConfirming] = useState(false);

  return (
    <SettingsSectionShell title={copy.sectionLabels.danger} subtitle={copy.dangerSubtitle}>
      <SettingsNotice state="NOT_AVAILABLE" text={copy.unsupportedDestructiveActions} />
      {confirming ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>{copy.signOutQuestion}</Text>
          <SettingsNotice state="DERIVED" text={copy.signOutDetail} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <SettingsButton label={copy.cancel} onPress={() => setConfirming(false)} disabled={loggingOut} />
            <SettingsButton label={loggingOut ? copy.loading : copy.confirmSignOut} onPress={() => void logout()} disabled={loggingOut} danger />
          </View>
        </View>
      ) : (
        <SettingsButton label={copy.confirmSignOut} onPress={() => setConfirming(true)} danger />
      )}
    </SettingsSectionShell>
  );
}
