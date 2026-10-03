import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useBilling } from "../../contexts/BillingContext";
import { useAppLanguage } from "../../contexts/LanguageContext";
import { useDashboardTheme } from "../../hooks/useDashboardTheme";
import { useSession } from "../../hooks/useSession";
import {
  googleLogin,
  registerAccount,
  requestPasswordReset,
  saveTokenFromCredentials,
} from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import {
  getGoogleClientIds,
  isGoogleAuthConfigured,
} from "../../lib/env";
import { useToast } from "../ui/Toast";
import {
  AccessField,
  GatewayButton,
  GatewayDivider,
  GatewayNotice,
  GatewayProviderButton,
} from "./AccessGatewayPrimitives";
import AuthScreenShell from "./AuthScreenShell";
import {
  accessGatewayCopy,
  type AccessGatewayMode,
} from "./access-gateway-copy";

WebBrowser.maybeCompleteAuthSession();

type DevLoginCardProps = {
  title?: string;
  subtitle?: string;
};

export default function DevLoginCard({
  title: contextualTitle,
  subtitle: contextualSubtitle,
}: DevLoginCardProps) {
  const router = useRouter();
  const { language, t } = useAppLanguage();
  const { setToken } = useSession();
  const { showToast } = useToast();
  const { refreshBilling } = useBilling();
  const { selectedThemeId, theme } = useDashboardTheme();
  const copy = accessGatewayCopy(language);

  const [mode, setMode] = useState<AccessGatewayMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<"google" | null>(null);
  const [error, setError] = useState("");

  const googleClientIds = useMemo(() => getGoogleClientIds(), []);
  const googleConfigured = isGoogleAuthConfigured();

  const [googleRequest, , promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId: googleClientIds.webClientId,
    androidClientId: googleClientIds.androidClientId,
    iosClientId: googleClientIds.iosClientId || undefined,
  });

  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;
  const accentSoft =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.goldGlow
      : theme.palette.royalGlow;

  const title =
    mode === "signup"
      ? copy.signupTitle
      : mode === "forgot"
        ? copy.forgotTitle
        : contextualTitle?.trim() || copy.signinTitle;

  const subtitle =
    mode === "signup"
      ? copy.signupSubtitle
      : mode === "forgot"
        ? copy.forgotSubtitle
        : contextualSubtitle?.trim() || copy.signinSubtitle;

  const switchMode = (nextMode: AccessGatewayMode) => {
    setMode(nextMode);
    setError("");

    if (nextMode === "signup") {
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }

    if (nextMode === "forgot") {
      setPassword("");
      setConfirmPassword("");
    }
  };

  const localizeAuthError = (err: any, fallback: string) => {
    const raw = getErrorMessage(err, fallback);
    const message = raw.toLowerCase();

    if (message.includes("email_not_verified")) {
      return t.auth.emailNotVerified;
    }

    if (message.includes("invalid credentials")) {
      return copy.invalidCredentials;
    }

    if (
      message.includes("account already exists") ||
      message.includes("already exists")
    ) {
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

    return raw || copy.genericError;
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
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
        password
      );

      setToken(token);
      await refreshBilling(token);
      showToast(t.auth.adminSessionRestored, "success");
      router.replace("/(tabs)");
    } catch (err: any) {
      const message = localizeAuthError(err, t.auth.signInFailed);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      const message = t.auth.googleAuthNotConfigured;
      setError(message);
      showToast(message, "error");
      return;
    }

    try {
      setProviderLoading("google");
      setError("");

      if (!googleRequest) {
        throw new Error("Google sign-in is not ready yet");
      }

      const result = await promptGoogleSignIn();

      if (
        result.type === "cancel" ||
        result.type === "dismiss"
      ) {
        return;
      }

      if (result.type !== "success") {
        throw new Error("Google sign-in did not complete");
      }

      const idToken = result.params?.id_token;

      if (!idToken) {
        throw new Error("Google did not return an ID token");
      }

      const token = await googleLogin(idToken);

      setToken(token);
      await refreshBilling(token);
      showToast(t.auth.googleSignInSuccess, "success");
      router.replace("/(tabs)");
    } catch (err: any) {
      const message = localizeAuthError(
        err,
        t.auth.googleSignInFailed
      );
      setError(message);
      showToast(message, "error");
    } finally {
      setProviderLoading(null);
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
      switchMode("signin");
    } catch (err: any) {
      const message = localizeAuthError(
        err,
        t.auth.passwordResetRequestFailed
      );
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      const message = t.auth.allAccountFieldsRequired;
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

      await registerAccount(
        fullName.trim(),
        email.trim(),
        password
      );

      switchMode("signin");
      setPassword("");
      setConfirmPassword("");
      showToast(t.auth.verifyEmailBeforeSignIn, "success");
    } catch (err: any) {
      const message = localizeAuthError(
        err,
        t.auth.createAccountFailed
      );
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel =
    loading
      ? mode === "signup"
        ? copy.creatingAccount
        : mode === "forgot"
          ? copy.sendingReset
          : copy.signingIn
      : mode === "signup"
        ? copy.createAccountAction
        : mode === "forgot"
          ? copy.sendResetAction
          : copy.signInAction;

  const primaryIcon =
    mode === "signup"
      ? "person-add-outline" as const
      : mode === "forgot"
        ? "mail-unread-outline" as const
        : "log-in-outline" as const;

  const handleAppleUnavailable = () => {
    const message = copy.appleNotConfigured;
    setError(message);
    showToast(message, "info");
  };

  return (
    <AuthScreenShell
      eyebrow={copy.overline}
      title={title}
      subtitle={subtitle}
    >
      <View style={styles.content}>
        <View
          accessibilityRole="radiogroup"
          style={[
            styles.modeSwitch,
            {
              backgroundColor: theme.palette.surface,
              borderColor: theme.palette.border,
            },
          ]}
        >
          {(["signin", "signup"] as const).map((item) => {
            const active = item === mode;
            const label =
              item === "signin"
                ? copy.signinTab
                : copy.signupTab;
            const icon =
              item === "signin"
                ? "log-in-outline" as const
                : "person-add-outline" as const;

            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => switchMode(item)}
                style={({ pressed }) => [
                  styles.modeButton,
                  {
                    backgroundColor: active
                      ? accentSoft
                      : "transparent",
                    borderColor: active
                      ? accent
                      : "transparent",
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={
                    active
                      ? accent
                      : theme.palette.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color: active
                        ? theme.palette.textPrimary
                        : theme.palette.textSecondary,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <GatewayNotice
            title={error}
            tone="error"
          />
        ) : null}

        <View style={styles.fields}>
          {mode === "signup" ? (
            <AccessField
              label={copy.fullNameLabel}
              value={fullName}
              onChangeText={setFullName}
              placeholder={copy.fullNamePlaceholder}
              icon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
          ) : null}

          <AccessField
            label={copy.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={copy.emailPlaceholder}
            icon="mail-outline"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          {mode !== "forgot" ? (
            <AccessField
              label={copy.passwordLabel}
              value={password}
              onChangeText={setPassword}
              placeholder={copy.passwordPlaceholder}
              icon="lock-closed-outline"
              secure
              autoComplete={
                mode === "signup"
                  ? "new-password"
                  : "current-password"
              }
              textContentType={
                mode === "signup"
                  ? "newPassword"
                  : "password"
              }
            />
          ) : null}

          {mode === "signin" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => switchMode("forgot")}
              style={({ pressed }) => [
                styles.forgotButton,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.forgotText,
                  { color: accent },
                ]}
              >
                {copy.forgotPassword}
              </Text>
            </Pressable>
          ) : null}

          {mode === "signup" ? (
            <AccessField
              label={copy.confirmPasswordLabel}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={copy.confirmPasswordPlaceholder}
              icon="shield-checkmark-outline"
              secure
              autoComplete="new-password"
              textContentType="newPassword"
            />
          ) : null}
        </View>

        <GatewayButton
          label={primaryLabel}
          icon={primaryIcon}
          onPress={
            mode === "signup"
              ? handleCreateAccount
              : mode === "forgot"
                ? handleForgotPassword
                : handleSignIn
          }
          disabled={loading || providerLoading !== null}
          loading={loading}
        />

        {mode === "forgot" ? (
          <GatewayButton
            label={copy.backToSignIn}
            icon="arrow-back-outline"
            onPress={() => switchMode("signin")}
            disabled={loading}
            variant="secondary"
          />
        ) : null}

        {mode === "signin" ? (
          <>
            <GatewayDivider label={copy.orContinue} />

            <View style={styles.providers}>
              <GatewayProviderButton
                label={copy.continueGoogle}
                meta={
                  googleConfigured
                    ? copy.configured
                    : copy.googleNotConfigured
                }
                brand="google"
                onPress={handleGoogleSignIn}
                disabled={
                  loading ||
                  providerLoading !== null ||
                  !googleConfigured
                }
                loading={providerLoading === "google"}
              />

              <GatewayProviderButton
                label={copy.continueApple}
                meta={copy.appleNotConfigured}
                brand="apple"
                onPress={handleAppleUnavailable}
                disabled
              />
            </View>
          </>
        ) : null}

        <GatewayNotice
          title={
            mode === "signup"
              ? copy.createWorkspaceTitle
              : mode === "forgot"
                ? copy.recoveryInfoTitle
                : copy.workspaceAccessTitle
          }
          body={
            mode === "signup"
              ? copy.createWorkspaceBody
              : mode === "forgot"
                ? copy.recoveryInfoBody
                : copy.workspaceAccessBody
          }
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    gap: 16,
  },
  modeSwitch: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  fields: {
    gap: 13,
  },
  forgotButton: {
    alignSelf: "flex-end",
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: "900",
  },
  providers: {
    gap: 10,
  },
});
