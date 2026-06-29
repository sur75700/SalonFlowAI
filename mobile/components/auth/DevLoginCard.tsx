import React, { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { UI } from "../../lib/theme/tokens";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ActionButton from "../dashboard/ActionButton";
import { useToast } from "../ui/Toast";
import AuthScreenShell from "./AuthScreenShell";
import { useSession } from "../../hooks/useSession";
import { DEFAULTS } from "../../lib/appConfig";
import { getErrorMessage } from "../../lib/errors";
import { getGoogleClientIds } from "../../lib/env";
import { appleLogin, googleLogin, registerAccount, requestPasswordReset, saveTokenFromCredentials } from "../../lib/api";
import { useAppLanguage } from "../../contexts/LanguageContext";
import { useBilling } from "../../contexts/BillingContext";

WebBrowser.maybeCompleteAuthSession();

type DevLoginCardProps = {
  title?: string;
  subtitle?: string;
};

export default function DevLoginCard({
  title = "Admin Session Recovery",
  subtitle = "Restore your active session to continue managing SalonFlow AI.",
}: DevLoginCardProps) {
  const { t } = useAppLanguage();
  const { setToken } = useSession();
  const { showToast } = useToast();
  const { refreshBilling } = useBilling();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState<string>(DEFAULTS.adminEmail);
  const [password, setPassword] = useState<string>(DEFAULTS.adminPassword);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const googleClientIds = getGoogleClientIds();
  const [googleRequest, , promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId: googleClientIds.webClientId,
    androidClientId: googleClientIds.androidClientId,
    iosClientId: googleClientIds.iosClientId || undefined,
  });


  const getLocalizedAuthError = (err: any, fallback: string) => {
    const message = getErrorMessage(err, fallback).toLowerCase();

    if (message.includes("email_not_verified")) {
      return t.auth.emailNotVerified;
    }


    if (message.includes("account already exists") || message.includes("already exists")) {
      return t.auth.accountAlreadyExists;
    }

    if (
      message.includes("valid email") ||
      message.includes("email address") ||
      message.includes("@-sign") ||
      message.includes("two periods") ||
      message.includes("body.email")
    ) {
      return t.auth.invalidEmail;
    }

    return getErrorMessage(err, fallback);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      const message = t.auth.emailPasswordRequired;
      setError(message);
      showToast(message, "error");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = await saveTokenFromCredentials(
        email.trim(),
        password.trim()
      );

      setToken(token);
      await refreshBilling(token);
      showToast(t.auth.adminSessionRestored, "success");
    } catch (err: any) {
      const message = getErrorMessage(err, t.auth.signInFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      const { webClientId, androidClientId } = googleClientIds;

      if (!webClientId && !androidClientId) {
        const message = t.auth.googleAuthNotConfigured;
        setError(message);
        showToast(message, "error");
        return;
      }

      if (!googleRequest) {
        throw new Error("Google sign-in is not ready yet");
      }

      const result = await promptGoogleSignIn();

      if (result.type !== "success") {
        throw new Error("Google sign-in was cancelled");
      }

      const idToken = result.params?.id_token;

      if (!idToken) {
        throw new Error("Google did not return an ID token");
      }

      const token = await googleLogin(idToken);

      setToken(token);
      await refreshBilling(token);
      showToast(t.auth.googleSignInSuccess, "success");
    } catch (err: any) {
      const message = getErrorMessage(err, t.auth.googleSignInFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      const available = await AppleAuthentication.isAvailableAsync();

      if (!available) {
        const message = t.auth.appleAuthNotAvailable;
        setError(message);
        showToast(message, "error");
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple did not return an identity token");
      }

      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(" ");

      const token = await appleLogin(credential.identityToken, fullName);

      setToken(token);
      await refreshBilling(token);
      showToast(t.auth.appleSignInSuccess, "success");
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED") {
        return;
      }

      const message = getErrorMessage(err, t.auth.appleSignInFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      const message = t.auth.emailRequired;
      setError(message);
      showToast(message, "error");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await requestPasswordReset(email.trim());

      showToast(t.auth.passwordResetEmailSent, "success");
      setMode("signin");
    } catch (err: any) {
      const message = getErrorMessage(err, t.auth.passwordResetRequestFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      const message = t.auth.allAccountFieldsRequired;
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

      await registerAccount(
        fullName.trim(),
        email.trim(),
        password.trim()
      );

      setMode("signin");
      setPassword("");
      setConfirmPassword("");
      showToast(t.auth.verifyEmailBeforeSignIn, "success");
    } catch (err: any) {
      const message = getLocalizedAuthError(err, t.auth.createAccountFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const useDemoAccount = () => {
    setMode("signin");
    setFullName("");
    setEmail(DEFAULTS.adminEmail);
    setPassword(DEFAULTS.adminPassword);
    setConfirmPassword("");
    setError("");
    showToast(t.auth.adminCredentialsLoaded, "info");
  };

  return (
    <AuthScreenShell title={title} subtitle={subtitle}>

      <View style={styles.modeSwitch}>
        <Text
          onPress={() => {
            setMode("signin");
            setError("");
          }}
          style={[
            styles.modeButton,
            mode === "signin" ? styles.modeButtonActive : styles.modeButtonIdle,
          ]}
        >
          {t.auth.signIn}
        </Text>

        <Text
          onPress={() => {
            setMode("signup");
            setFullName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setError("");
          }}
          style={[
            styles.modeButton,
            mode === "signup" ? styles.modeButtonActive : styles.modeButtonIdle,
          ]}
        >
          {t.auth.createAccount}
        </Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t.auth.adminRecoveryBadge}</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {mode === "signup" ? (
        <>
          <Text style={styles.label}>{t.auth.fullName}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.auth.fullName}
            placeholderTextColor="#938b9d"
            value={fullName}
            onChangeText={setFullName}
          />
        </>
      ) : null}

      <Text style={styles.label}>{t.auth.email}</Text>
      <TextInput
        style={styles.input}
        placeholder={DEFAULTS.adminEmail}
        placeholderTextColor="#938b9d"
        value={email}
        onChangeText={(text) => setEmail(text)}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {mode !== "forgot" ? (
        <>
          <Text style={styles.label}>{t.auth.password}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.auth.enterPassword}
            placeholderTextColor="#938b9d"
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry
          />
        </>
      ) : null}

      {mode === "signin" ? (
        <Text
          onPress={() => {
            setMode("forgot");
            setPassword("");
            setConfirmPassword("");
            setError("");
          }}
          style={styles.forgotLink}
        >
          {t.auth.forgotPassword}
        </Text>
      ) : null}

      {mode === "signup" ? (
        <>
          <Text style={styles.label}>{t.auth.confirmPassword}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.auth.confirmPassword}
            placeholderTextColor="#938b9d"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </>
      ) : null}

      <View style={styles.actions}>
        <ActionButton
          title={
            loading
              ? mode === "signup"
                ? t.auth.creatingAccount
                : mode === "forgot"
                  ? t.auth.sendingResetLink
                  : t.auth.restoreSessionLoading
              : mode === "signup"
                ? t.auth.createAccount
                : mode === "forgot"
                  ? t.auth.sendResetLink
                  : t.auth.restoreSession
          }
          onPress={
            mode === "signup"
              ? handleCreateAccount
              : mode === "forgot"
                ? handleForgotPassword
                : handleSignIn
          }
          disabled={loading}
          tone="success"
        />
        {mode === "signin" ? (
          <ActionButton
            title={t.auth.continueWithGoogle}
            onPress={handleGoogleSignIn}
            disabled={loading}
          />
        ) : null}
        {mode === "signin" ? (
          <ActionButton
            title={t.auth.continueWithApple}
            onPress={handleAppleSignIn}
            disabled={loading}
          />
        ) : null}
        {mode === "signin" ? (
          <ActionButton title={t.auth.loadAdminAccess} onPress={useDemoAccount} />
        ) : null}
        {mode === "forgot" ? (
          <ActionButton
            title={t.auth.backToSignIn}
            onPress={() => {
              setMode("signin");
              setError("");
            }}
          />
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          {mode === "signup" ? t.auth.createWorkspaceTitle : t.auth.sessionRecoveryTitle}
        </Text>
        <Text style={styles.infoText}>
          {mode === "signup"
            ? t.auth.createWorkspaceSubtitle
            : t.auth.sessionRecoverySubtitle}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({

  modeSwitch: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: UI.spacing.md,
  },
  modeButton: {
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.sm,
    fontSize: UI.font.tiny,
    fontWeight: "900",
    letterSpacing: 0.8,
    overflow: "hidden",
    textTransform: "uppercase",
  },
  modeButtonActive: {
    backgroundColor: "rgba(242,209,122,0.16)",
    borderColor: "#f2d17a",
    color: "#f2d17a",
  },
  modeButtonIdle: {
    backgroundColor: "#11131a",
    borderColor: "#31384a",
    color: "#c9c2cf",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#1b1f2a",
    borderWidth: 1,
    borderColor: "#31384a",
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.xs,
    borderRadius: UI.radius.pill,
    marginBottom: UI.spacing.md,
  },
  badgeText: {
    color: "#f2d17a",
    fontSize: UI.font.tiny,
    fontWeight: "900",
    letterSpacing: 1,
  },
  label: {
    color: "#f5d27a",
    fontSize: UI.font.body,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
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
    marginTop: 4,
    marginBottom: 14,
  },
  infoCard: {
    marginTop: 6,
    backgroundColor: "#11131a",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    boxShadow: UI.depth.soft,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#232834",
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: UI.font.subtitle,
    fontWeight: "900",
    marginBottom: 6,
  },
  infoText: {
    color: "#c9c2cf",
    fontSize: UI.font.body,
    lineHeight: 20,
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
  loaderWrap: {
    marginTop: 14,
    alignItems: "center",
  },
  forgotLink: {
    color: "#d6b46a",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "right",
  },
});
