import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAppLanguage } from "../contexts/LanguageContext";
import { useToast } from "../components/ui/Toast";
import {
  AccessField,
  GatewayButton,
  GatewayNotice,
} from "../components/auth/AccessGatewayPrimitives";
import AuthScreenShell from "../components/auth/AuthScreenShell";
import { accessGatewayCopy } from "../components/auth/access-gateway-copy";
import { resetPassword } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

export default function ResetPasswordScreen() {
  const { language, t } = useAppLanguage();
  const copy = accessGatewayCopy(language);
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ token?: string }>();

  const token =
    typeof params.token === "string"
      ? params.token
      : "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!token) {
      const message = copy.invalidResetToken;
      setError(message);
      showToast(message, "error");
      return;
    }

    if (!password || !confirmPassword) {
      const message = t.auth.passwordFieldsRequired;
      setError(message);
      showToast(message, "error");
      return;
    }

    if (password.length < 8) {
      const message = t.auth.passwordMinLength;
      setError(message);
      showToast(message, "error");
      return;
    }

    if (password !== confirmPassword) {
      const message = t.auth.passwordMismatch;
      setError(message);
      showToast(message, "error");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await resetPassword(token, password);

      setDone(true);
      setPassword("");
      setConfirmPassword("");
      showToast(t.auth.passwordResetSuccessful, "success");
    } catch (err: any) {
      const message = getErrorMessage(
        err,
        t.auth.passwordResetFailed
      );
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      eyebrow={copy.overline}
      title={copy.resetTitle}
      subtitle={copy.resetSubtitle}
    >
      <View style={styles.content}>
        {error ? (
          <GatewayNotice
            title={error}
            tone="error"
          />
        ) : null}

        {done ? (
          <>
            <GatewayNotice
              title={copy.resetSuccessTitle}
              body={copy.resetSuccessBody}
              tone="success"
            />

            <GatewayButton
              label={copy.backToSignIn}
              icon="arrow-back-outline"
              onPress={() => router.replace("/login")}
            />
          </>
        ) : (
          <>
            <View style={styles.fields}>
              <AccessField
                label={copy.newPasswordLabel}
                value={password}
                onChangeText={setPassword}
                placeholder={copy.passwordPlaceholder}
                icon="lock-closed-outline"
                secure
                autoComplete="new-password"
                textContentType="newPassword"
              />

              <AccessField
                label={copy.confirmNewPasswordLabel}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={copy.confirmPasswordPlaceholder}
                icon="shield-checkmark-outline"
                secure
                autoComplete="new-password"
                textContentType="newPassword"
              />
            </View>

            <GatewayButton
              label={loading ? copy.resetting : copy.resetAction}
              icon="key-outline"
              onPress={handleReset}
              disabled={loading}
              loading={loading}
            />

            <GatewayButton
              label={copy.backToSignIn}
              icon="arrow-back-outline"
              onPress={() => router.replace("/login")}
              disabled={loading}
              variant="secondary"
            />
          </>
        )}
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    gap: 16,
  },
  fields: {
    gap: 13,
  },
});
