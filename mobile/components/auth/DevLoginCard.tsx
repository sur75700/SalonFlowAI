import React, { useState } from "react";
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
import { registerAccount, saveTokenFromCredentials } from "../../lib/api";
import { useAppLanguage } from "../../contexts/LanguageContext";

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

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState<string>(DEFAULTS.adminEmail);
  const [password, setPassword] = useState<string>(DEFAULTS.adminPassword);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      const message = "Email and password are required";
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
      showToast("Admin session restored", "success");
    } catch (err: any) {
      const message = getErrorMessage(err, t.auth.signInFailed);
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

      const token = await registerAccount(
        fullName.trim(),
        email.trim(),
        password.trim()
      );

      setToken(token);
      showToast(t.auth.accountCreated, "success");
    } catch (err: any) {
      const message = getErrorMessage(err, t.auth.createAccountFailed);
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
    showToast("Admin credentials loaded", "info");
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
            setEmail("");
            setPassword("");
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

      <Text style={styles.label}>{t.auth.password}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#938b9d"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />

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
                : t.auth.restoreSessionLoading
              : mode === "signup"
                ? t.auth.createAccount
                : t.auth.restoreSession
          }
          onPress={mode === "signup" ? handleCreateAccount : handleSignIn}
          disabled={loading}
          tone="success"
        />
        {mode === "signin" ? (
          <ActionButton title={t.auth.loadAdminAccess} onPress={useDemoAccount} />
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
});
