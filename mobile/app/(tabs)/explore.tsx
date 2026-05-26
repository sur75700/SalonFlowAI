import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";

type QuickLinkProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

function QuickLink({ title, subtitle, onPress }: QuickLinkProps) {
  return (
    <Pressable onPress={onPress} style={styles.linkCard}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function WorkspaceScreen() {
  const { locale } = useAppPreferences();
  const openDocs = () => {
    Linking.openURL("https://salonflowai-backend.onrender.com/docs");
  };

  const openBackend = () => {
    Linking.openURL("https://salonflowai-backend.onrender.com/healthz");
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.overline}>SALONFLOW AI</Text>
        <Text style={styles.title}>{t("Workspace", locale)}</Text>
        <Text style={styles.subtitle}>
          {t("WorkspaceHeroSubtitle", locale)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Quick Navigation", locale)}</Text>

        <QuickLink
          title={t("Open Dashboard", locale)}
          subtitle={t("Open DashboardSubtitle", locale)}
          onPress={() => router.navigate("/(tabs)")}
        />
        <QuickLink
          title={t("Open Bookings", locale)}
          subtitle={t("Open Bookings Subtitle", locale)}
          onPress={() => router.navigate("/(tabs)/appointments")}
        />
        <QuickLink
          title={t("Open Clients", locale)}
          subtitle={t("Open ClientsSubtitle", locale)}
          onPress={() => router.navigate("/(tabs)/clients")}
        />
        <QuickLink
          title={t("Open Service Catalog", locale)}
          subtitle={t("Open Service Catalog Subtitle", locale)}
          onPress={() => router.navigate("/(tabs)/services")}
        />
        <QuickLink
          title={t("Open Insights", locale)}
          subtitle={t("Open Insights Subtitle", locale)}
          onPress={() => router.navigate("/(tabs)/analytics")}
        />
        <QuickLink
          title={t("Open Pdf Reports", locale)}
          subtitle={t("Open Pdf ReportsSubtitle", locale)}
          onPress={() => router.navigate("/(tabs)/reports")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Backend Access", locale)}</Text>

        <QuickLink
          title={t("Open Api Docs", locale)}
          subtitle={t("Open Api DocsSubtitle", locale)}
          onPress={openDocs}
        />
        <QuickLink
          title={t("Check Backend Health", locale)}
          subtitle={t("Check Backend Health Subtitle", locale)}
          onPress={openBackend}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Operator Notes", locale)}</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            {t("Operator Notes Line One", locale)}
          </Text>
          <Text style={styles.noteText}>
            {t("Operator NotesLineTwo", locale)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0d12",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  hero: {
    marginBottom: 20,
  },
  overline: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#232834",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  linkCard: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  linkTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  linkSubtitle: {
    color: "#c9c2cf",
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  noteText: {
    color: "#d7d2de",
    fontSize: 14,
    lineHeight: 21,
  },
});
