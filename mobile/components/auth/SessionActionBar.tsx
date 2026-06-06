import React from "react";
import { UI } from "../../lib/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

import ActionButton from "../dashboard/ActionButton";
import { useAppLanguage } from "../../contexts/LanguageContext";

type SessionActionBarProps = {
  email?: string;
  onLogout: () => void;
  loggingOut?: boolean;
};

export default function SessionActionBar({
  email: _email,
  onLogout,
  loggingOut = false,
}: SessionActionBarProps) {
  const { t } = useAppLanguage();
  return (
    <View style={styles.wrap}>
      <View style={styles.info}>
        <Text style={styles.label}>{t.workspace.sessionLabel}</Text>
        <Text style={styles.title}>{t.session.adminSessionActive}</Text>
        <Text style={styles.subtitle}>
          {t.session.fallbackSignedIn}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          title={loggingOut ? t.session.closingSession : t.session.closeSession}
          onPress={onLogout}
          disabled={loggingOut}
          tone="danger"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#232834",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    marginBottom: UI.spacing.md,
    boxShadow: UI.depth.soft,
    elevation: 6,
    gap: 12,
  },
  info: {
    gap: 4,
  },
  label: {
    color: "#f2d17a",
    fontSize: UI.font.tiny,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  subtitle: {
    color: "#c9c2cf",
    fontSize: UI.font.body,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
