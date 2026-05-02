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
import { useAnalyticsData } from "../../hooks/useDashboardData";
import { useSession } from "../../hooks/useSession";
import { money, shortDay } from "../../utils/formatters";

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

export default function AnalyticsScreen() {
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
        analytics?.currency || "AMD"
      ),
    },
    {
      label: "Scheduled Pipeline",
      value: money(
        analytics?.totals?.scheduled_pipeline,
        analytics?.currency || "AMD"
      ),
    },
    {
      label: "Cancelled Value",
      value: money(
        analytics?.totals?.cancelled_value,
        analytics?.currency || "AMD"
      ),
    },
    {
      label: "Avg Completed Ticket",
      value: money(
        analytics?.totals?.avg_completed_booking_value,
        analytics?.currency || "AMD"
      ),
    },
  ];

  if (booting || loading) {
    return <AnalyticsSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title="Insights"
        subtitle="Your admin session is unavailable. Restore access to continue."
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
          <Text style={styles.heroTitle}>Insights</Text>
          <Text style={styles.heroText}>
            Revenue intelligence, service performance, and booking status insights.
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title="Analytics Ready"
          subtitle="Revenue, service performance, and booking signals are now synced with your active session."
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
          title="Executive Snapshot"
          subtitle="High-level financial visibility for the active salon session."
        >
          <View style={styles.executiveGrid}>
            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>Completed Revenue</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.totals?.completed_revenue, analytics?.currency || "AMD")}
              </Text>
            </View>

            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>Scheduled Pipeline</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.totals?.scheduled_pipeline, analytics?.currency || "AMD")}
              </Text>
            </View>

            <View style={styles.executiveCard}>
              <Text style={styles.executiveLabel}>Cancelled Value</Text>
              <Text style={styles.executiveValue}>
                {money(analytics?.totals?.cancelled_value, analytics?.currency || "AMD")}
              </Text>
            </View>
          </View>
        </ChartBlock>

        <ChartBlock
          title="Revenue Trendline"
          subtitle="Completed revenue movement across the last 7 days."
        >
          {!lineChartData.length ? (
            <EmptyState
              title="No revenue data available"
              subtitle="Revenue trend will appear after completed bookings start accumulating."
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
          title="Top Performing Services"
          subtitle="Highest-performing services ranked by revenue contribution."
        >
          {!barChartData.length ? (
            <EmptyState
              title="No service analytics yet"
              subtitle="Top services will appear once appointments start generating revenue."
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
          title="Booking Status Distribution"
          subtitle="Scheduled, completed, and cancelled appointment mix."
        >
          {!pieChartData.length ? (
            <EmptyState
              title="No status data yet"
              subtitle="Appointment status distribution will appear after bookings are created."
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
                  <Text style={styles.legendText}>Scheduled</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#15803d" }]}
                  />
                  <Text style={styles.legendText}>Completed</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#b91c1c" }]}
                  />
                  <Text style={styles.legendText}>Cancelled</Text>
                </View>
              </View>
            </>
          )}
        </ChartBlock>

        <ChartBlock
          title="Business Snapshot"
          subtitle="Quick revenue and volume summary."
        >
          <View style={styles.metricRow}>
            <Text style={styles.item}>Total Revenue Snapshot</Text>
            <Text style={styles.metricValue}>
              {money(
                analytics?.totals?.total_revenue_snapshot,
                analytics?.currency || "AMD"
              )}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>Total Appointments</Text>
            <Text style={styles.metricValue}>
              {summary?.total_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>Today Appointments</Text>
            <Text style={styles.metricValue}>
              {summary?.today_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>Total Clients</Text>
            <Text style={styles.metricValue}>{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>Total Services</Text>
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
});
