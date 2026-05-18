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
import ActionButton from "../../components/dashboard/ActionButton";
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
import { UI } from "../../lib/theme/tokens";

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
  const { summary, analytics, loading, refreshing, error, reload, refresh } =
    useAnalyticsData(token, clearToken);

  const lineChartData = useMemo(() => {
    const trend = analytics?.revenueTrend ?? analytics?.revenue_last_7_days ?? [];

    if (trend.length) {
      return trend.map((item: any, index: number) => ({
        value: Number(item.completed_revenue ?? item.revenue ?? item.value ?? 0),
        label: item.date ? shortDay(item.date) : `D${index + 1}`,
      }));
    }

    const total = Number(
      analytics?.completedRevenue ??
      analytics?.completed_revenue ??
      analytics?.total_revenue ??
      analytics?.totals?.completed_revenue ??
      0
    );

    return [
      { value: Math.round(total * 0.15), label: "D1" },
      { value: Math.round(total * 0.25), label: "D2" },
      { value: Math.round(total * 0.40), label: "D3" },
      { value: Math.round(total * 0.65), label: "D4" },
      { value: total, label: "Now" },
    ].filter((x) => x.value > 0);
  }, [analytics]);

  const barChartData = useMemo(() => {
    const services =
      analytics?.topPerformingServices ??
      analytics?.top_performing_services ??
      analytics?.top_services ??
      [];

    return services.map((item: any) => {
      const name = item.name ?? item.service_name ?? "Service";
      return {
        value: Number(item.revenue || 0),
        label: name.length > 10 ? name.slice(0, 10) + "…" : name,
        frontColor: "#f2d17a",
      };
    });
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
        analytics?.completedRevenue ?? analytics?.completed_revenue ?? analytics?.total_revenue ?? analytics?.totals?.completed_revenue,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: "Scheduled Pipeline",
      value: money(
        analytics?.scheduledPipeline ?? analytics?.scheduled_pipeline ?? analytics?.totals?.scheduled_pipeline,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: "Cancelled Value",
      value: money(
        analytics?.cancelledValue ?? analytics?.cancelled_value ?? analytics?.totals?.cancelled_value,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: "Avg Completed Ticket",
      value: money(
        analytics?.avgCompletedTicket ?? analytics?.avg_completed_ticket ?? analytics?.totals?.avg_completed_booking_value,
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
        title={t("Insights", locale)}
        subtitle={t("Session Unavailable Subtitle", locale)}
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
          <Text style={styles.heroTitle}>{t("Insights", locale)}</Text>
          <Text style={styles.heroText}>
            {t("Analytics Hero Subtitle", locale)}
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("Analytics Ready", locale)}
          subtitle={t("Analytics Ready Subtitle", locale)}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Analytics sync needs attention</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <ActionButton
                title={refreshing ? "Retrying..." : "Retry"}
                tone="warning"
                disabled={refreshing}
                onPress={reload}
              />
            </View>
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
          title={t("Executive Snapshot", locale)}
          subtitle={t("Executive Snapshot Analytics Subtitle", locale)}
        >
          <View style={styles.executiveGrid}>
            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>{t("CompletedRevenue", locale)}</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.completedRevenue ?? analytics?.completed_revenue ?? analytics?.total_revenue ?? analytics?.totals?.completed_revenue, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>

            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>{t("ScheduledPipeline", locale)}</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.scheduledPipeline ?? analytics?.scheduled_pipeline ?? analytics?.totals?.scheduled_pipeline, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>

            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>{t("Cancelled Value", locale)}</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.cancelledValue ?? analytics?.cancelled_value ?? analytics?.totals?.cancelled_value, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>
          </View>
        </ChartBlock>

        <ChartBlock
          title={t("Revenue Trendline", locale)}
          subtitle={t("Revenue Trendline Subtitle", locale)}
        >
          {!lineChartData.length ? (
            <EmptyState
              title={t("No Revenue Data Available", locale)}
              subtitle={t("No Revenue Data AvailableSubtitle", locale)}
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
          title={t("Top Performing Services", locale)}
          subtitle={t("Top Performing Services Subtitle", locale)}
        >
          {!barChartData.length ? (
            <EmptyState
              title={t("No Service Analytics Yet", locale)}
              subtitle={t("No Service Analytics YetSubtitle", locale)}
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
          title={t("Booking Status Distribution", locale)}
          subtitle={t("Booking Status Distribution Subtitle", locale)}
        >
          {!pieChartData.length ? (
            <EmptyState
              title={t("No Status Data Yet", locale)}
              subtitle={t("No Status Data YetSubtitle", locale)}
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
                  <Text style={styles.legendText}>{t("Scheduled", locale)}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#15803d" }]}
                  />
                  <Text style={styles.legendText}>{t("Completed", locale)}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#b91c1c" }]}
                  />
                  <Text style={styles.legendText}>{t("Cancelled", locale)}</Text>
                </View>
              </View>
            </>
          )}
        </ChartBlock>

        <ChartBlock
          title={t("Business Snapshot", locale)}
          subtitle={t("Business SnapshotSubtitle", locale)}
        >
          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Revenue Snapshot", locale)}</Text>
            <Text style={styles.metricValue}>
              {money(
                analytics?.totals?.total_revenue_snapshot,
                normalizeAnalyticsCurrency(analytics?.currency)
              )}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Bookings", locale)}</Text>
            <Text style={styles.metricValue}>
              {summary?.total_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("TodayBookings", locale)}</Text>
            <Text style={styles.metricValue}>
              {summary?.today_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Clients", locale)}</Text>
            <Text style={styles.metricValue}>{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Services", locale)}</Text>
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
    boxShadow: UI.depth.hero,
    elevation: 12,
    backgroundColor: "rgba(8, 10, 18, 0.92)",
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
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  statSkeletonCard: {
    width: "48%",
    backgroundColor: "#11131d",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 20,
    padding: 18,
  },
  sectionSkeleton: {
    backgroundColor: "#11131d",
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
    backgroundColor: "#38161f",
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
    backgroundColor: "#141824",
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
