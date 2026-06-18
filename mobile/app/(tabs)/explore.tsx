import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import PricingPlansCard from "../../components/pricing/PricingPlansCard";
import RoyalCosmosBackground from "../../components/ui/RoyalCosmosBackground";
import AccountOverviewCard from "../../components/settings/AccountOverviewCard";
import SecurityCard from "../../components/settings/SecurityCard";
import SubscriptionStatusCard from "../../components/settings/SubscriptionStatusCard";
import PackageCapabilityMatrix from "../../components/subscription/PackageCapabilityMatrix";
import AIControlCenter from "../../components/subscription/AIControlCenter";
import SystemStatusCenter from "../../components/system/SystemStatusCenter";
import AuditLogsCenter from "../../components/system/AuditLogsCenter";

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
    <RoyalCosmosBackground style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
        <Text style={styles.overline}>SALONFLOW AI</Text>
        <Text style={styles.title}>{t("Settings Center", locale)}</Text>
        <Text style={styles.subtitle}>
          {t("Settings Center Subtitle", locale)}
        </Text>
      </View>

      <AccountOverviewCard />

      <SecurityCard />

      <SubscriptionStatusCard />

      <PackageCapabilityMatrix />

      <AIControlCenter />

      <SystemStatusCenter />

      <AuditLogsCenter />

      <PricingPlansCard />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("App Navigation", locale)}</Text>

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
        <Text style={styles.sectionTitle}>{t("System Tools", locale)}</Text>

        <QuickLink
          title={t("Open API Console", locale)}
          subtitle={t("Open API Console Subtitle", locale)}
          onPress={openDocs}
        />
        <QuickLink
          title={t("Check System Health", locale)}
          subtitle={t("Check System Health Subtitle", locale)}
          onPress={openBackend}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Support Notes", locale)}</Text>
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
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
