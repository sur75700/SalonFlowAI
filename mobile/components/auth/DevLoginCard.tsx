import React, { useState } from "react";
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
import { saveTokenFromCredentials } from "../../lib/api";

type DevLoginCardProps = {
  title?: string;
  subtitle?: string;
};

export default function DevLoginCard({
  title = "Sign in",
  subtitle = "Your session is missing or expired. Sign in to continue using the admin panel.",
}: DevLoginCardProps) {
  const { setToken } = useSession();
  const { showToast } = useToast();

  const [email, setEmail] = useState(DEFAULTS.adminEmail);
  const [password, setPassword] = useState(DEFAULTS.adminPassword);
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
      showToast("Signed in successfully", "success");
    } catch (err: any) {
      const message = getErrorMessage(err, "Failed to sign in");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const useDemoAccount = () => {
    setEmail(DEFAULTS.adminEmail);
    setPassword(DEFAULTS.adminPassword);
    setError("");
    showToast("Demo admin credentials filled", "info");
  };

  return (
    <AuthScreenShell title={title} subtitle={subtitle}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>ADMIN ACCESS</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder={DEFAULTS.adminEmail}
        placeholderTextColor="#938b9d"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        placeholderTextColor="#938b9d"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.actions}>
        <ActionButton
          title={loading ? "Signing in..." : "Sign In"}
          onPress={handleSignIn}
          disabled={loading}
          tone="success"
        />
        <ActionButton title="Use Demo Admin" onPress={useDemoAccount} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Session UX</Text>
        <Text style={styles.infoText}>
          When your token expires, the admin screen will bring you back here so
          you can restore access quickly.
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
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#1b1f2a",
    borderWidth: 1,
    borderColor: "#31384a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: {
    color: "#f2d17a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  label: {
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#11131a",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
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
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#232834",
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  infoText: {
    color: "#c9c2cf",
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: "#301218",
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorText: {
    color: "#ffcad3",
    fontSize: 14,
  },
  loaderWrap: {
    marginTop: 14,
    alignItems: "center",
  },
});
