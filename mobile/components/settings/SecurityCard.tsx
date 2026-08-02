import { StyleSheet, Text, TextInput, View } from "react-native";

import { useState } from "react";

import ActionButton from "../dashboard/ActionButton";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { useLogout } from "../../hooks/useLogout";
import { useSession } from "../../hooks/useSession";
import { changePassword } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";
import { useToast } from "../ui/Toast";

export default function SecurityCard() {
  const { locale } = useAppPreferences();
  const { sessionEmail, sessionUser, token } = useSession();
  const { logout, loggingOut } = useLogout();
  const { showToast } = useToast();

  const [changingPassword, setChangingPassword] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!token) {
      showToast(t("Change Password Session Unavailable", locale), "error");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast(t("Change Password Fields Required", locale), "error");
      return;
    }

    if (newPassword.trim().length < 8) {
      showToast(t("Change Password Min Length", locale), "error");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      showToast(t("Change Password Mismatch", locale), "error");
      return;
    }

    try {
      setChangingPassword(true);
      const result = await changePassword(token, currentPassword, newPassword);
      showToast(result.message || "Password changed successfully", "success");
      resetPasswordForm();
      setFormVisible(false);
    } catch (err: any) {
      showToast(getErrorMessage(err, t("Change Password Failed", locale)), "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🔐 {t("Security Center", locale)}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>{t("Security Session", locale)}</Text>
        <Text style={styles.active}>{t("Security Session Active", locale)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t("Account Email", locale)}</Text>
        <Text style={styles.value}>{sessionUser?.email || sessionEmail || "—"}</Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          title={t("Change Password", locale)}
          onPress={() => setFormVisible((current) => !current)}
          tone="warning"
        />
        <ActionButton
          title={loggingOut ? t("Signing Out", locale) : t("Sign Out", locale)}
          onPress={logout}
          disabled={loggingOut}
          tone="danger"
        />
      </View>

      {formVisible ? (
        <View style={styles.passwordForm}>
          <Text style={styles.formTitle}>{t("Change Password", locale)}</Text>

          <TextInput
            style={styles.input}
            placeholder={t("Current Password", locale)}
            placeholderTextColor="#94a3b8"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder={t("New Password", locale)}
            placeholderTextColor="#94a3b8"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder={t("Confirm New Password", locale)}
            placeholderTextColor="#94a3b8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <View style={styles.formActions}>
            <ActionButton
              title={changingPassword ? t("Updating Password", locale) : t("Update Password", locale)}
              onPress={handleChangePassword}
              disabled={changingPassword}
              tone="success"
            />
            <ActionButton
              title={t("Cancel", locale)}
              onPress={() => {
                resetPasswordForm();
                setFormVisible(false);
              }}
              disabled={changingPassword}
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.note}>{t("Security Placeholder Note", locale)}</Text>
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
    marginBottom: 18,
  },
  row: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  value: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  active: {
    color: "#22c55e",
    fontSize: 15,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  passwordForm: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#475569",
    gap: 10,
  },
  formTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 12,
  },
});
