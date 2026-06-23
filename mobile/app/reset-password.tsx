import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import AuthScreenShell from "../components/auth/AuthScreenShell";
import ActionButton from "../components/dashboard/ActionButton";
import { useAppLanguage } from "../contexts/LanguageContext";
import { resetPassword } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { UI } from "../lib/theme/tokens";
import { useToast } from "../components/ui/Toast";

export default function ResetPasswordScreen() {
  const { t } = useAppLanguage();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ token?: string }>();

  const token = typeof params.token === "string" ? params.token : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!token) {
      const message = t.auth.invalidResetToken;
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      const message = t.auth.passwordFieldsRequired;
      setError(message);
      showToast(message, "error");
      return;
    }

    if (password.trim().length < 8) {
      const message = t.auth.passwordMinLength;
      setError(message);
      showToast(message, "error");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      const message = t.auth.passwordMismatch;
      setError(message);
      showToast(message, "error");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await resetPassword(token, password.trim());

      setDone(true);
      setPassword("");
      setConfirmPassword("");
      showToast(t.auth.passwordResetSuccessful, "success");
    } catch (err: any) {
      const message = getErrorMessage(err, t.auth.passwordResetFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title={t.auth.resetPasswordTitle}
      subtitle={t.auth.resetPasswordSubtitle}
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {done ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>{t.auth.passwordResetSuccessful}</Text>
          <Text style={styles.successText}>{t.auth.passwordResetSuccessHelp}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>{t.auth.newPassword}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.auth.newPassword}
            placeholderTextColor="#938b9d"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>{t.auth.confirmPassword}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.auth.confirmPassword}
            placeholderTextColor="#938b9d"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <View style={styles.actions}>
            <ActionButton
              title={loading ? t.auth.resettingPassword : t.auth.resetPassword}
              onPress={handleReset}
              disabled={loading}
              tone="success"
            />
          </View>
        </>
      )}

      <View style={styles.actions}>
        <ActionButton
          title={t.auth.backToSignIn}
          onPress={() => router.replace("/(tabs)")}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#f7f1ff",
    fontSize: UI.font.body,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: "#11131a",
    color: "#ffffff",
    borderRadius: UI.radius.md,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.md,
    marginBottom: UI.spacing.sm,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: "#301218",
    padding: UI.spacing.md,
    borderRadius: UI.radius.md,
    marginBottom: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorText: {
    color: "#ffcad3",
    fontSize: UI.font.body,
  },
  successBox: {
    backgroundColor: "#10291b",
    padding: UI.spacing.md,
    borderRadius: UI.radius.md,
    marginBottom: UI.spacing.md,
    borderWidth: 1,
    borderColor: "#1f7a3a",
  },
  successTitle: {
    color: "#dcfce7",
    fontSize: UI.font.subtitle,
    fontWeight: "900",
    marginBottom: 6,
  },
  successText: {
    color: "#bbf7d0",
    fontSize: UI.font.body,
    lineHeight: 20,
  },
});
