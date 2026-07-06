import HeroKPI from "@/components/dashboard/HeroKPI";
import React from "react";
import { UI } from "../../lib/theme/tokens";
import { router } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import DevLoginCard from "../../components/auth/DevLoginCard";
import { useLogout } from "../../hooks/useLogout";
import SectionCard from "../../components/dashboard/SectionCard";
import ActionButton from "../../components/dashboard/ActionButton";
import CommandTile from "../../components/dashboard/CommandTile";
import ExecutiveHealthCard from "../../components/dashboard/ExecutiveHealthCard";
import StatCard from "../../components/dashboard/StatCard";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import EmptyState from "../../components/ui/EmptyState";
import RoyalCosmosBackground from "../../components/ui/RoyalCosmosBackground";
import { useSummaryData } from "../../hooks/useDashboardData";
import { useSession } from "../../hooks/useSession";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { getResponsiveLayout } from "../../lib/layout/responsive";

function OverviewSkeleton() {
  return (
    <RoyalCosmosBackground style={styles.container}>
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
    </RoyalCosmosBackground>
  );
}

export default function OverviewScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const responsiveContentStyle = [
    styles.content,
    { paddingHorizontal: layout.screenPadding },
  ];
  const responsiveCardStyle = layout.singleColumn
    ? styles.responsiveFullCard
    : styles.responsiveGridCard;

  const { locale } = useAppPreferences();
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { summary, loading, refreshing, error, reload, refresh } = useSummaryData(
    token,
    clearToken
  );

  const statCards = [
    { label: t("Clients", locale), value: summary?.total_clients ?? 0 },
    { label: t("Services", locale), value: summary?.total_services ?? 0 },
    { label: t("Total Bookings", locale), value: summary?.total_appointments ?? 0 },
    { label: t("Scheduled", locale), value: summary?.scheduled_appointments ?? 0 },
    { label: t("Completed", locale), value: summary?.completed_appointments ?? 0 },
    { label: t("Cancelled", locale), value: summary?.cancelled_appointments ?? 0 },
    { label: t("Today", locale), value: summary?.today_appointments ?? 0 },
  ];

  const hasNoSummaryActivity =
    !!summary && statCards.every((card) => Number(card.value) === 0);

  if (booting) {
    return <OverviewSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title={t("Dashboard", locale)}
        subtitle={t("Session Unavailable Subtitle", locale)}
      />
    );
  }

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <RoyalCosmosBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={responsiveContentStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>ROYAL COMMAND CENTER</Text>
            </View>
            <View style={styles.heroLivePill}>
              <Text style={styles.heroLiveDot}>●</Text>
              <Text style={styles.heroLiveText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
            {t("Dashboard", locale)}
          </Text>
          <Text style={styles.heroText}>
            {t("Dashboard Hero Subtitle", locale)}
          </Text>

          <View style={styles.heroSignalRow}>
            <Text style={styles.heroSignalText}>{summary?.total_appointments ?? 0} {t("Total Bookings", locale)}</Text>
            <Text style={styles.heroSignalDivider}>•</Text>
            <Text style={styles.heroSignalText}>{summary?.completed_appointments ?? 0} {t("Completed", locale)}</Text>
            <Text style={styles.heroSignalDivider}>•</Text>
            <Text style={styles.heroSignalText}>{summary?.today_appointments ?? 0} {t("Today", locale)}</Text>
          </View>

        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{t("Dashboard sync needs attention", locale)}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <ActionButton
                title={refreshing ? t("Retrying", locale) : t("Retry", locale)}
                tone="warning"
                disabled={refreshing}
                onPress={reload}
              />
            </View>
          </View>
        ) : null}

        {hasNoSummaryActivity ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No dashboard activity yet"
              subtitle="Create your first client, service, or appointment to activate the command center metrics."
            />
          </View>
        ) : null}

        <View style={styles.aiStatusStrip}>
          <View style={styles.aiStatusSignal}>
            <Text style={styles.aiStatusIcon}>🟢</Text>
            <Text style={styles.aiStatusLabel}>AI ONLINE</Text>
          </View>
          <View style={styles.aiStatusSignal}>
            <Text style={styles.aiStatusIcon}>🌌</Text>
            <Text style={styles.aiStatusLabel}>COSMOS SYNCED</Text>
          </View>
          <View style={styles.aiStatusSignal}>
            <Text style={styles.aiStatusIcon}>⚡</Text>
            <Text style={styles.aiStatusLabel}>LIVE DATA</Text>
          </View>
          <View style={styles.aiStatusSignal}>
            <Text style={styles.aiStatusIcon}>🛡️</Text>
            <Text style={styles.aiStatusLabel}>VERIFIED</Text>
          </View>
        </View>

        <View style={styles.dashboardSectionHeader}>
          <Text style={styles.dashboardSectionOverline}>EXECUTIVE KPIs</Text>
          <Text style={styles.dashboardSectionTitle}>Business command signals</Text>
        </View>

        <View style={styles.statsGrid}>
          {statCards.slice(0, 4).map((card) => (
            <View key={card.label} style={responsiveCardStyle}>
              <StatCard label={card.label} value={card.value} />
            </View>
          ))}
        </View>

        <View style={styles.dashboardSectionHeader}>
          <Text style={styles.dashboardSectionOverline}>TODAY'S OPERATIONS</Text>
          <Text style={styles.dashboardSectionTitle}>Live booking activity</Text>
        </View>

        <View style={styles.statsGrid}>
          {statCards.slice(4).map((card) => (
            <View key={card.label} style={responsiveCardStyle}>
              <StatCard label={card.label} value={card.value} variant="accent" />
            </View>
          ))}
        </View>

        <SectionCard
          title={t("Command Navigation", locale)}
          subtitle={t("Command NavigationSubtitle", locale)}
        >
          <View style={styles.commandTilesGrid}>
            <CommandTile
              icon="📊"
              style={responsiveCardStyle}
              title={t("Insights", locale)}
              subtitle={t("Insights Info Subtitle", locale)}
              onPress={() => router.navigate("/(tabs)/analytics")}
            />
            <CommandTile
              icon="📅"
              style={responsiveCardStyle}
              title={t("Appointments", locale)}
              subtitle={t("AppointmentsInfoSubtitle", locale)}
              onPress={() => router.navigate("/(tabs)/appointments")}
            />
            <CommandTile
              icon="👥"
              style={responsiveCardStyle}
              title={t("Clients", locale)}
              subtitle={t("ClientsInfoSubtitle", locale)}
              onPress={() => router.navigate("/(tabs)/clients")}
            />
            <CommandTile
              icon="✂️"
              style={responsiveCardStyle}
              title={t("Service Catalog", locale)}
              subtitle={t("Service CatalogHeroSubtitle", locale)}
              onPress={() => router.navigate("/(tabs)/services")}
            />
          </View>
        </SectionCard>

        <SectionCard
          title={t("Executive Snapshot", locale)}
          subtitle={t("Executive Snapshot Subtitle", locale)}
        >
          <View style={styles.executiveHealthGrid}>
            <ExecutiveHealthCard
              icon="🟢"
              title="Business Health"
              value="Healthy"
              subtitle={`${summary?.completed_appointments ?? 0} completed · ${summary?.cancelled_appointments ?? 0} needs attention`}
            />
            <ExecutiveHealthCard
              icon="📅"
              title="Operations"
              value={summary?.total_appointments ?? 0}
              subtitle={`${summary?.scheduled_appointments ?? 0} scheduled · ${summary?.today_appointments ?? 0} today`}
            />
            <ExecutiveHealthCard
              icon="👥"
              title="Client Base"
              value={summary?.total_clients ?? 0}
              subtitle={`${summary?.total_services ?? 0} active services ready`}
            />
            <ExecutiveHealthCard
              icon="⚡"
              title="Executive Status"
              value="Ready"
              subtitle="AI monitoring · live command center"
            />
          </View>
        </SectionCard>
      </ScrollView>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: 16, paddingBottom: UI.spacing.bottom },
  hero: {
    boxShadow: UI.depth.hero,
    elevation: 18,
    backgroundColor: "rgba(10, 11, 16, 0.88)",
    borderRadius: UI.radius.hero,
    overflow: "hidden",
    padding: UI.spacing.lg,
    marginBottom: 10,
    minHeight: 250,
    borderWidth: 1,
    borderColor: "rgba(242, 209, 122, 0.34)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  heroBadge: {
    borderRadius: UI.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(242, 209, 122, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(242, 209, 122, 0.28)",
  },
  heroBadgeText: {
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heroLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: UI.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.28)",
  },
  heroLiveDot: {
    color: "#22c55e",
    fontSize: 10,
  },
  heroLiveText: {
    color: "#bbf7d0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroSignalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 0,
  },
  heroSignalText: {
    color: "#e8ddff",
    fontSize: 12,
    fontWeight: "800",
  },
  heroSignalDivider: {
    color: "rgba(245, 210, 122, 0.62)",
    fontSize: 12,
    fontWeight: "900",
  },
  heroOverline: {
    color: "#f2d17a",
    fontSize: UI.font.overline,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroTitle: {
    width: "100%",
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "#b7adbf",
    fontSize: 13,
    lineHeight: 18,
  },
  aiStatusStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: -24,
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: UI.radius.xl,
    padding: 12,
    backgroundColor: "rgba(10, 11, 16, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.22)",
    boxShadow: UI.depth.card,
    elevation: 10,
  },
  aiStatusSignal: {
    flexGrow: 1,
    flexBasis: "22%",
    minWidth: 128,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: UI.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  aiStatusIcon: {
    fontSize: 13,
  },
  aiStatusLabel: {
    color: "#bbf7d0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  dashboardSectionHeader: {
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dashboardSectionOverline: {
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  dashboardSectionTitle: {
    color: "#f8fafc",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  responsiveFullCard: {
    width: "100%",
  },
  responsiveGridCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 156,
  },
  statSkeletonCard: {
    width: "48%",
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: UI.radius.lg,
    padding: 18,
  },
  sectionSkeleton: {
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.lg,
  },
  commandTilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  commandTile: {
    minHeight: 58,
    backgroundColor: "rgba(12, 14, 22, 0.88)",
    borderColor: "rgba(242, 209, 122, 0.24)",
  },
  infoBlock: {
    backgroundColor: "#11131a",
    borderRadius: UI.radius.md,
    padding: UI.spacing.md,
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
  executiveHealthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2230",
  },
  metricLabel: {
    flex: 1,
    color: "#ece7ef",
    fontSize: 12,
    lineHeight: 16,
    paddingRight: 10,
  },
  metricValue: {
    width: 48,
    flexShrink: 0,
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  errorBox: {
    backgroundColor: "#301218",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  errorText: {
    color: "#ffcad3",
    fontSize: 14,
    lineHeight: 21,
  },
  errorActions: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emptyWrap: {
    marginBottom: 20,
  },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    columnGap: 12,
  },
  quickActionCell: {
    width: "48%",
  },
});
