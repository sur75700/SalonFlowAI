import React from "react";
import { UI } from "../../lib/theme/tokens";
import { router } from "expo-router";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import SectionCard from "../../components/dashboard/SectionCard";
import ActionButton from "../../components/dashboard/ActionButton";
import StatCard from "../../components/dashboard/StatCard";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { useSummaryData } from "../../hooks/useDashboardData";
import { useSession } from "../../hooks/useSession";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";

function OverviewSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={38} width={180} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="100%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="88%" />
        </View>

        <View style={styles.statsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.statSkeletonCard}>
              <LoadingSkeleton height={12} width={80} style={{ marginBottom: 14 }} />
              <LoadingSkeleton height={24} width={70} />
            </View>
          ))}
        </View>

        <View style={styles.sectionSkeleton}>
          <LoadingSkeleton height={20} width={170} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="90%" style={{ marginBottom: 18 }} />
          <LoadingSkeleton height={48} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={48} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={48} width="100%" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function OverviewScreen() {
  const { locale } = useAppPreferences();
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { summary, loading, refreshing, error, refresh } = useSummaryData(
    token,
    clearToken
  );

  const statCards = [
    { label: "Clients", value: summary?.total_clients ?? 0 },
    { label: "Services", value: summary?.total_services ?? 0 },
    { label: "Total Bookings", value: summary?.total_appointments ?? 0 },
    { label: "Scheduled", value: summary?.scheduled_appointments ?? 0 },
    { label: "Completed", value: summary?.completed_appointments ?? 0 },
    { label: "Cancelled", value: summary?.cancelled_appointments ?? 0 },
    { label: "Today", value: summary?.today_appointments ?? 0 },
  ];

  if (booting) {
    return <OverviewSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title={t("common.dashboard", locale)}
        subtitle={t("common.sessionUnavailableSubtitle", locale)}
      />
    );
  }

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle}>{t("common.dashboard", locale)}</Text>
          <Text style={styles.heroText}>
            Premium salon command center for bookings, clients, services, analytics,
            and reporting—organized into focused operational sections.
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("common.operationsReady", locale)}
          subtitle={t("common.operationsReadySubtitle", locale)}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </View>

        <SectionCard
          title={t("common.commandNavigation", locale)}
          subtitle={t("common.commandNavigationSubtitle", locale)}
        >
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("common.insights", locale)}</Text>
            <Text style={styles.infoText}>
              {t("common.insightsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("common.pdfReports", locale)}</Text>
            <Text style={styles.infoText}>
              {t("common.pdfReportsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("common.appointments", locale)}</Text>
            <Text style={styles.infoText}>
              {t("common.appointmentsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("common.clients", locale)}</Text>
            <Text style={styles.infoText}>
              {t("common.clientsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("common.serviceCatalog", locale)}</Text>
            <Text style={styles.infoText}>
              {t("common.serviceCatalogHeroSubtitle", locale)}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title={t("common.quickActions", locale)}
          subtitle={t("common.quickActionsSubtitle", locale)}
        >
          <View style={styles.quickActionsGrid}>
            <ActionButton
              title={t("common.openBookings", locale)}
              onPress={() => router.navigate("/(tabs)/appointments")}
            />
            <ActionButton
              title={t("common.openClients", locale)}
              onPress={() => router.navigate("/(tabs)/clients")}
            />
            <ActionButton
              title={t("common.openServiceCatalog", locale)}
              onPress={() => router.navigate("/(tabs)/services")}
            />
            <ActionButton
              title={t("common.openInsights", locale)}
              onPress={() => router.navigate("/(tabs)/analytics")}
            />
            <ActionButton
              title={t("common.openPdfReports", locale)}
              onPress={() => router.navigate("/(tabs)/reports")}
            />
          </View>
        </SectionCard>

        <SectionCard
          title={t("common.executiveSnapshot", locale)}
          subtitle={t("common.executiveSnapshotSubtitle", locale)}
        >
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.totalClients", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.totalServices", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_services ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.totalBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.scheduledBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.scheduled_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.completedBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.completed_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.cancelledBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.cancelled_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t("common.todayBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.today_appointments ?? 0}</Text>
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: 22, paddingBottom: 40 },
  hero: {
    boxShadow: UI.depth.hero,
    elevation: 12,
    backgroundColor: "rgba(10, 11, 16, 0.96)",
    borderRadius: 30,
    padding: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#27212c",
  },
  heroOverline: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "#b7adbf",
    fontSize: 15,
    lineHeight: 23,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statSkeletonCard: {
    width: "48%",
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 20,
    padding: 18,
  },
  sectionSkeleton: {
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 24,
    padding: 20,
  },
  infoBlock: {
    backgroundColor: "#11131a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#232834",
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  infoText: {
    color: "#c9c2cf",
    fontSize: 14,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2230",
  },
  metricLabel: {
    color: "#ece7ef",
    fontSize: 14,
  },
  metricValue: {
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "#301218",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorText: {
    color: "#ffcad3",
    fontSize: 14,
  },


  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
