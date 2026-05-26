import React from "react";
import { UI } from "../../lib/theme/tokens";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthScreenShell({
  title,
  subtitle,
  children,
}: AuthScreenShellProps) {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.overline}>SALONFLOW AI</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: "#040508",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: UI.spacing.screen,
    paddingBottom: UI.spacing.bottom,
  },
  hero: {
    marginBottom: UI.spacing.lg,
    backgroundColor: "#0a0b10",
    borderRadius: UI.radius.hero,
    padding: UI.spacing.xl,
    boxShadow: UI.depth.hero,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#27212c",
  },
  overline: {
    color: "#f2d17a",
    fontSize: UI.font.overline,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: UI.font.subtitle,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#0f1118",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.lg,
    boxShadow: UI.depth.card,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#241f27",
  },
});
