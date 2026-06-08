import LanguageSwitcher from "../../components/ui/LanguageSwitcher";
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
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import SectionCard from "../../components/dashboard/SectionCard";
import ActionButton from "../../components/dashboard/ActionButton";
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
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Dashboard", locale)}</Text>
          <Text style={styles.heroText}>
            {t("Dashboard Hero Subtitle", locale)}
          </Text>
          <LanguageSwitcher />
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("Operations Ready", locale)}
          subtitle={t("Operations ReadySubtitle", locale)}
        />

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

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View key={card.label} style={responsiveCardStyle}>
              <StatCard label={card.label} value={card.value} />
            </View>
          ))}
        </View>

        <SectionCard
          title={t("Command Navigation", locale)}
          subtitle={t("Command NavigationSubtitle", locale)}
        >
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Insights", locale)}</Text>
            <Text style={styles.infoText}>
              {t("Insights Info Subtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Pdf Reports", locale)}</Text>
            <Text style={styles.infoText}>
              {t("Pdf ReportsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Appointments", locale)}</Text>
            <Text style={styles.infoText}>
              {t("AppointmentsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Clients", locale)}</Text>
            <Text style={styles.infoText}>
              {t("ClientsInfoSubtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Service Catalog", locale)}</Text>
            <Text style={styles.infoText}>
              {t("Service CatalogHeroSubtitle", locale)}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title={t("Quick Actions", locale)}
          subtitle={t("Quick Actions Subtitle", locale)}
        >
          <View style={styles.quickActionsGrid}>
            <ActionButton
              compact
              style={[styles.quickActionCell, responsiveCardStyle]}
              title={t("Bookings", locale)}
              onPress={() => router.navigate("/(tabs)/appointments")}
            />
            <ActionButton
              compact
              style={[styles.quickActionCell, responsiveCardStyle]}
              title={t("Clients", locale)}
              onPress={() => router.navigate("/(tabs)/clients")}
            />
            <ActionButton
              compact
              style={[styles.quickActionCell, responsiveCardStyle]}
              title={t("Services", locale)}
              onPress={() => router.navigate("/(tabs)/services")}
            />
            <ActionButton
              compact
              style={[styles.quickActionCell, responsiveCardStyle]}
              title={t("Insights", locale)}
              onPress={() => router.navigate("/(tabs)/analytics")}
            />
            <ActionButton
              compact
              style={[styles.quickActionCell, responsiveCardStyle]}
              title="Reports"
              onPress={() => router.navigate("/(tabs)/reports")}
            />
          </View>
        </SectionCard>

        <SectionCard
          title={t("Executive Snapshot", locale)}
          subtitle={t("Executive Snapshot Subtitle", locale)}
        >
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Total Clients", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Total Services", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_services ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Total Bookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("ScheduledBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.scheduled_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("CompletedBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.completed_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Cancelled Bookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.cancelled_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("TodayBookings", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.today_appointments ?? 0}</Text>
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
    elevation: 12,
    backgroundColor: "rgba(10, 11, 16, 0.96)",
    borderRadius: UI.radius.hero,
    padding: UI.spacing.xl,
    marginBottom: UI.spacing.lg,
    borderWidth: 1,
    borderColor: "#27212c",
  },
  heroOverline: {
    color: "#f2d17a",
    fontSize: UI.font.overline,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    width: "100%",
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "#b7adbf",
    fontSize: 13,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
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
    marginBottom: 16,
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
