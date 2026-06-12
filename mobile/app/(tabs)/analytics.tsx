import React, { useMemo } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

import ChartBlock from "../../components/dashboard/ChartBlock";
import ActionButton from "../../components/dashboard/ActionButton";
import StatCard from "../../components/dashboard/StatCard";
import AIInsightsCard from "../../components/analytics/AIInsightsCard";
import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import EmptyState from "../../components/ui/EmptyState";
import RoyalCosmosBackground from "../../components/ui/RoyalCosmosBackground";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { t } from "../../lib/i18n";
import type { AppCurrency } from "../../lib/i18n/types";
import { useAnalyticsData } from "../../hooks/useDashboardData";
import { useSession } from "../../hooks/useSession";
import { shortDay } from "../../utils/formatters";
import { money } from "../../utils/money";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { UI } from "../../lib/theme/tokens";
import { getResponsiveLayout } from "../../lib/layout/responsive";

function AnalyticsSkeleton() {
  return (
    <RoyalCosmosBackground style={styles.container}>
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
    </RoyalCosmosBackground>
  );
}

function normalizeAnalyticsCurrency(value: string | null | undefined): AppCurrency {
  if (value === "AMD" || value === "USD" || value === "EUR") return value;
  return "AMD";
}

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const responsiveContentStyle = [
    styles.content,
    { paddingHorizontal: layout.screenPadding },
  ];
  const responsiveCardStyle = layout.singleColumn
    ? styles.responsiveFullCard
    : styles.responsiveGridCard;

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
        label: item.date ? shortDay(item.date) : `${t("Day Short", locale)}${index + 1}`,
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
      { value: total, label: t("Now", locale) },
    ].filter((x) => x.value > 0);
  }, [analytics]);

  const barChartData = useMemo(() => {
    const services =
      analytics?.topPerformingServices ??
      analytics?.top_performing_services ??
      analytics?.top_services ??
      [];

    return services.map((item: any) => {
      const name = item.name ?? item.service_name ?? t("Service", locale);
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
      },
      {
        value: Number(summary.completed_appointments || 0),
        color: "#15803d",
      },
      {
        value: Number(summary.cancelled_appointments || 0),
        color: "#b91c1c",
      },
    ].filter((x) => x.value > 0);
  }, [summary]);

  const analyticsCards = [
    {
      label: t("CompletedRevenue", locale),
      value: money(
        analytics?.completedRevenue ?? analytics?.completed_revenue ?? analytics?.total_revenue ?? analytics?.totals?.completed_revenue,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: t("ScheduledPipeline", locale),
      value: money(
        analytics?.scheduledPipeline ?? analytics?.scheduled_pipeline ?? analytics?.totals?.scheduled_pipeline,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: t("Cancelled Value", locale),
      value: money(
        analytics?.cancelledValue ?? analytics?.cancelled_value ?? analytics?.totals?.cancelled_value,
        normalizeAnalyticsCurrency(analytics?.currency)
      ),
    },
    {
      label: t("Avg Completed Ticket", locale),
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
    <RoyalCosmosBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Insights", locale)}</Text>
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

        <AIInsightsCard
          insights={analytics?.insights}
          forecast={analytics?.forecast}
          riskSummary={analytics?.risk_summary}
          growthSummary={analytics?.growth_summary}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{t("Analytics sync needs attention", locale)}</Text>
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

        <View style={styles.analyticsGrid}>
          {analyticsCards.map((card) => (
            <View key={card.label} style={responsiveCardStyle}>
              <StatCard
                label={card.label}
                value={card.value}
                variant="accent"
              />
            </View>
          ))}
        </View>

        <ChartBlock
          title={t("Executive Snapshot", locale)}
          subtitle={t("Executive Snapshot Analytics Subtitle", locale)}
        >
          <View style={styles.executiveGrid}>
            <View style={[styles.executiveCard, responsiveCardStyle]}>
              <Text style={styles.executiveLabel}>{t("CompletedRevenue", locale)}</Text>
              <Text style={styles.executiveValue} numberOfLines={1} adjustsFontSizeToFit>
                {money(analytics?.completedRevenue ?? analytics?.completed_revenue ?? analytics?.total_revenue ?? analytics?.totals?.completed_revenue, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>

            <View style={[styles.executiveCard, responsiveCardStyle]}>
              <Text style={styles.executiveLabel}>{t("ScheduledPipeline", locale)}</Text>
              <Text style={styles.executiveValue} numberOfLines={1} adjustsFontSizeToFit>
                {money(analytics?.scheduledPipeline ?? analytics?.scheduled_pipeline ?? analytics?.totals?.scheduled_pipeline, normalizeAnalyticsCurrency(analytics?.currency))}
              </Text>
            </View>

            <View style={[styles.executiveCard, responsiveCardStyle]}>
              <Text style={styles.executiveLabel}>{t("Cancelled Value", locale)}</Text>
              <Text style={styles.executiveValue} numberOfLines={1} adjustsFontSizeToFit>
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
                spacing={34}
                initialSpacing={6}
                textColor1="#cbbfe0"
                textFontSize={8}
                yAxisTextStyle={{ color: "#9ea3b3", fontSize: 8 }}
                xAxisLabelTextStyle={{ color: "#9ea3b3", fontSize: 8 }}
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
                yAxisTextStyle={{ color: "#9ea3b3", fontSize: 8 }}
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
                  textColor="white"
                  radius={110}
                  innerRadius={58}
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
            <Text style={styles.item} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{t("Total Revenue Snapshot", locale)}</Text>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
              {money(
                analytics?.totals?.total_revenue_snapshot,
                normalizeAnalyticsCurrency(analytics?.currency)
              )}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Bookings", locale)}</Text>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
              {summary?.total_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("TodayBookings", locale)}</Text>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
              {summary?.today_appointments ?? 0}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Clients", locale)}</Text>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.item}>{t("Total Services", locale)}</Text>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">{summary?.total_services ?? 0}</Text>
          </View>
        </ChartBlock>
      </ScrollView>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: UI.spacing.screen, paddingBottom: UI.spacing.bottom },
  hero: {
    boxShadow: UI.depth.hero,
    elevation: 12,
    backgroundColor: "rgba(8, 10, 18, 0.92)",
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
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: UI.spacing.lg,
  },
  responsiveFullCard: {
    width: "100%",
  },
  responsiveGridCard: {
    width: "100%",
    flexBasis: "100%",
    flexGrow: 0,
    minWidth: 0,
  },
  statSkeletonCard: {
    width: "48%",
    backgroundColor: "#11131d",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: UI.radius.lg,
    padding: UI.spacing.lg,
  },
  sectionSkeleton: {
    backgroundColor: "#11131d",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: UI.radius.xl,
    padding: UI.spacing.lg,
    marginBottom: UI.spacing.lg,
  },
  chartWrap: {
    marginTop: UI.spacing.xs,
    paddingTop: UI.spacing.sm,
    overflow: "hidden",
  },
  pieWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: UI.spacing.sm,
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: UI.spacing.md,
    marginTop: UI.spacing.sm,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: UI.spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: UI.radius.pill,
  },
  legendText: {
    color: "#d8dce6",
    fontSize: UI.font.overline,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2230",
  },
  metricValue: {
    width: 84,
    flexShrink: 0,
    color: "#f5d27a",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  item: {
    color: "#ece7ef",
    fontSize: 14,
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: "#38161f",
    padding: UI.spacing.md,
    borderRadius: UI.radius.md,
    marginBottom: UI.spacing.md,
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
    gap: UI.spacing.sm,
    marginTop: UI.spacing.xs,
  },
  executiveCard: {
    width: "100%",
    flexBasis: "100%",
    flexGrow: 0,
    minWidth: 0,
    backgroundColor: "#141824",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: UI.radius.md,
    padding: UI.spacing.md,
    boxShadow: UI.depth.soft,
    elevation: 6,
  },
  executiveLabel: {
    color: "#c9c2cf",
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.05,
  },
  executiveValue: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
  },
});
