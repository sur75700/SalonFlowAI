import React, { useMemo } from "react";
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

import ChartBlock from "../../components/dashboard/ChartBlock";
import StatCard from "../../components/dashboard/StatCard";
import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { t } from "../../lib/i18n";
import type { AppCurrency } from "../../lib/i18n/types";
import { useAnalyticsData } from "../../hooks/useDashboardData";
import { useSession } from "../../hooks/useSession";
import { shortDay } from "../../utils/formatters";
import { money } from "../../utils/money";
import { useAppPreferences } from "../../hooks/useAppPreferences";

function AnalyticsSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={36} width={170} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="96%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="80%" />
        </View>

        <View style={styles.analyticsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.statSkeletonCard}>
              <LoadingSkeleton height={12} width={100} style={{ marginBottom: 14 }} />
              <LoadingSkeleton height={24} width={120} />
            </View>
          ))}
        </View>

        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.sectionSkeleton}>
            <LoadingSkeleton height={20} width={180} style={{ marginBottom: 10 }} />
            <LoadingSkeleton height={14} width="75%" style={{ marginBottom: 16 }} />
            <LoadingSkeleton height={220} width="100%" />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeAnalyticsCurrency(value: string | null | undefined): AppCurrency {
  if (value === "AMD" || value === "USD" || value === "EUR") return value;
  return "AMD";
}

export default function AnalyticsScreen() {
  const { locale, currency: preferredCurrency } = useAppPreferences();
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { summary, analytics, loading, refreshing, error, refresh } =
    useAnalyticsData(token, clearToken);

  const lineChartData = useMemo(() => {
    return (analytics?.revenue_last_7_days || []).map((item) => ({
      value: Number(item.completed_revenue || 0),
      label: shortDay(item.date),
    }));
  }, [analytics]);

  const barChartData = useMemo(() => {
    return (analytics?.top_services || []).map((item) => ({
      value: Number(item.revenue || 0),
      label:
        item.service_name.length > 10
          ? item.service_name.slice(0, 10) + "…"
          : item.service_name,
      frontColor: "#f2d17a",
    }));
  }, [analytics]);

  const pieChartData = useMemo(() => {
    if (!summary) return [];

    return [
      {
        value: Number(summary.scheduled_appointments || 0),
        color: "#1d4ed8",
        text: "Scheduled",
      },
      {
        value: Number(summary.completed_appointments || 0),
        color: "#15803d",
        text: "Completed",
      },
      {
        value: Number(summary.cancelled_appointments || 0),
        color: "#b91c1c",
        text: "Cancelled",
      },
    ].filter((x) => x.value > 0);
  }, [summary]);

  const analyticsCards = [
    {
      label: "Completed Revenue",
      value: money(
        analytics?.totals?.completed_revenue,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: "Scheduled Pipeline",
      value: money(
        analytics?.totals?.scheduled_pipeline,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: "Cancelled Value",
      value: money(
        analytics?.totals?.cancelled_value,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: "Avg Completed Ticket",
      value: money(
        analytics?.totals?.avg_completed_booking_value,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
  ];

  if (booting || loading) {
    return <AnalyticsSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title={t("common.insights", locale)}
        subtitle={t("common.sessionUnavailableSubtitle", locale)}
      />
    );
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
          <Text style={styles.heroTitle}>{t("common.insights", locale)}</Text>
          <Text style={styles.heroText}>
            {t("common.analyticsHeroSubtitle", locale)}
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("common.analyticsReady", locale)}
          subtitle={t("common.analyticsReadySubtitle", locale)}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.analyticsGrid}>
          {analyticsCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              variant="accent"
            />
          ))}
        </View>

        <ChartBlock
          title={t("common.executiveSnapshot", locale)}
          subtitle={t("common.executiveSnapshotAnalyticsSubtitle", locale)}
        >
          <View style={styles.executiveGrid}>
            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>{t("common.completedRevenue", locale)}</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.totals?.completed_revenue, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>

            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>{t("common.scheduledPipeline", locale)}</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.totals?.scheduled_pipeline, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>

            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>{t("common.cancelledValue", locale)}</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.totals?.cancelled_value, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>
          </View>
        </ChartBlock>

        <ChartBlock
          title={t("common.revenueTrendline", locale)}
          subtitle={t("common.revenueTrendlineSubtitle", locale)}
        >
          {!lineChartData.length ? (
            <EmptyState
              title={t("common.noRevenueDataAvailable", locale)}
              subtitle={t("common.noRevenueDataAvailableSubtitle", locale)}
            />
          ) : (
            <View style={styles.chartWrap}>
              <LineChart
                data={lineChartData}
                areaChart
                curved
                thickness={3}
                hideDataPoints={false}
                startFillColor="#8b5cf6"
                endFillColor="#8b5cf6"
                startOpacity={0.25}
                endOpacity={0.05}
                color="#8b5cf6"
                yAxisColor="#2a3040"
                xAxisColor="#2a3040"
                rulesColor="#1c2230"
                noOfSections={4}
                spacing={42}
                initialSpacing={10}
                textColor1="#cbbfe0"
                textFontSize={11}
                yAxisTextStyle={{ color: "#9ea3b3" }}
                xAxisLabelTextStyle={{ color: "#9ea3b3" }}
                hideOrigin
                width={Platform.OS === "web" ? 760 : 320}
              />
            </View>
          )}
        </ChartBlock>

        <ChartBlock
          title={t("common.topPerformingServices", locale)}
          subtitle={t("common.topPerformingServicesSubtitle", locale)}
        >
          {!barChartData.length ? (
            <EmptyState
              title={t("common.noServiceAnalyticsYet", locale)}
              subtitle={t("common.noServiceAnalyticsYetSubtitle", locale)}
            />
          ) : (
            <View style={styles.chartWrap}>
              <BarChart
                data={barChartData}
                barWidth={28}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules={false}
                rulesColor="#1c2230"
                xAxisColor="#2a3040"
                yAxisColor="#2a3040"
                yAxisTextStyle={{ color: "#9ea3b3" }}
                xAxisLabelTextStyle={{ color: "#cbbfe0", fontSize: 10 }}
                noOfSections={4}
                width={Platform.OS === "web" ? 760 : 320}
              />
            </View>
          )}
        </ChartBlock>

        <ChartBlock
          title={t("common.bookingStatusDistribution", locale)}
          subtitle={t("common.bookingStatusDistributionSubtitle", locale)}
        >
          {!pieChartData.length ? (
            <EmptyState
              title={t("common.noStatusDataYet", locale)}
              subtitle={t("common.noStatusDataYetSubtitle", locale)}
            />
          ) : (
            <>
              <View style={styles.pieWrap}>
                <PieChart
                  data={pieChartData}
                  donut
                  showText
                  textColor="white"
                  radius={110}
                  innerRadius={58}
                  textSize={11}
                  focusOnPress
                  strokeColor="#0a0b10"
                  strokeWidth={2}
                />
              </View>

              <View style={styles.legendWrap}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#1d4ed8" }]}
                  />
                  <Text style={styles.legendText}>{t("common.scheduled", locale)}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#15803d" }]}
                  />
                  <Text style={styles.legendText}>{t("common.completed", locale)}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#b91c1c" }]}
                  />
                  <Text style={styles.legendText}>{t("common.cancelled", locale)}</Text>
                </View>
              </View>
            </>
          )}
        </ChartBlock>

        <ChartBlock
          title={t("common.businessSnapshot", locale)}
          subtitle={t("common.businessSnapshotSubtitle", locale)}
        >
          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("common.totalRevenueSnapshot", locale)}</Text>
            <Text style={styles.metricValue}>
              {money(
                analytics?.totals?.total_revenue_snapshot,
                normalizeAnalyticsCurrency(analytics?.currency)
              )}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("common.totalBookings", locale)}</Text>
            <Text style={styles.metricValue}>
              {summary?.total_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("common.todayBookings", locale)}</Text>
            <Text style={styles.metricValue}>
              {summary?.today_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("common.totalClients", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("common.totalServices", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_services ?? 0}</Text>
          </View>
        </ChartBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: 22, paddingBottom: 40 },
  hero: {
    backgroundColor: "#0a0b10",
    borderRadius: 30,
    padding: 26,
    marginBottom: 20,
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
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
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
    marginBottom: 18,
  },
  chartWrap: {
    marginTop: 6,
    paddingTop: 10,
    overflow: "hidden",
  },
  pieWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    color: "#d8dce6",
    fontSize: 13,
    fontWeight: "700",
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
  metricValue: {
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
  },
  item: {
    color: "#ece7ef",
    fontSize: 14,
    marginBottom: 4,
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


  executiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  executiveCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
  },
  executiveLabel: {
    color: "#c9c2cf",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  executiveValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
});
