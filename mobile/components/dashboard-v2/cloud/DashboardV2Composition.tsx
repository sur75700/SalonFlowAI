import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import ExecutiveGreetingV2 from './ExecutiveGreetingV2';
import KPICardV2 from './KPICardV2';
import RevenueAnalyticsV2 from './RevenueAnalyticsV2';
import AppointmentAnalyticsV2 from './AppointmentAnalyticsV2';
import AICommandCenterV2 from './AICommandCenterV2';
import QuickActionsV2 from './QuickActionsV2';
import CalendarSnapshotV2 from './CalendarSnapshotV2';
import StaffPerformanceV2 from './StaffPerformanceV2';
import RecentActivityV2 from './RecentActivityV2';
import RoyalCosmosBackground from '../../ui/RoyalCosmosBackground';
import { useSession } from '../../../hooks/useSession';
import { useAnalyticsData } from '../../../hooks/useDashboardData';
import { useAppPreferences } from '../../../hooks/useAppPreferences';
import { formatMoney } from '../../../utils/money';
import type { AppCurrency } from '../../../lib/i18n/types';

type DeviceClass = 'phone' | 'tablet' | 'desktop';

function classifyDevice(width: number): DeviceClass {
  if (width >= 1100) return 'desktop';
  if (width >= 700) return 'tablet';
  return 'phone';
}

const SUPPORTED_REVENUE_CURRENCIES:
  readonly AppCurrency[] = ['AMD', 'USD', 'EUR', 'RUB'];

function normalizeRevenueCurrency(
  value: string | null | undefined
): AppCurrency {
  const normalized = value?.trim().toUpperCase();

  return SUPPORTED_REVENUE_CURRENCIES.includes(
    normalized as AppCurrency
  )
    ? (normalized as AppCurrency)
    : 'AMD';
}

function formatRevenueDateLabel(
  value: string,
  locale: string
): string {
  const date = new Date(`${value}T00:00:00`);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return value;
  }
}

function formatCompactRevenue(
  value: number,
  currency: AppCurrency,
  locale: string
): string {
  const safeValue =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : 0;

  const absoluteValue = Math.abs(safeValue);

  let divisor = 1;
  let suffix = '';

  if (absoluteValue >= 1_000_000_000) {
    divisor = 1_000_000_000;
    suffix = 'B';
  } else if (absoluteValue >= 1_000_000) {
    divisor = 1_000_000;
    suffix = 'M';
  } else if (absoluteValue >= 1_000) {
    divisor = 1_000;
    suffix = 'K';
  }

  try {
    const compactNumber = new Intl.NumberFormat(locale, {
      maximumFractionDigits: divisor === 1 ? 0 : 1,
    }).format(safeValue / divisor);

    return `${compactNumber}${suffix} ${currency}`;
  } catch {
    return `${Math.round(safeValue / divisor)}${suffix} ${currency}`;
  }
}

function getLocalDateKey(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ---- sample data — visual QA only, not real business data ----




const quickActionBlueprints = [
  {
    id: 'clients',
    label: 'Clients',
    icon: <Text style={{ fontSize: 20 }}>👥</Text>,
    tone: 'gold' as const,
  },
  {
    id: 'services',
    label: 'Services',
    icon: <Text style={{ fontSize: 20 }}>✂️</Text>,
    tone: 'royal' as const,
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: <Text style={{ fontSize: 20 }}>📅</Text>,
    tone: 'blue' as const,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <Text style={{ fontSize: 20 }}>📄</Text>,
    tone: 'green' as const,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Text style={{ fontSize: 20 }}>⚙️</Text>,
    tone: 'gold' as const,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <Text style={{ fontSize: 20 }}>📊</Text>,
    tone: 'royal' as const,
  },
];

const calendarEvents = [
  {
    id: 'evt-1',
    time: '2:30 PM',
    clientName: 'Sarah K.',
    serviceName: 'Balayage Color',
    staffName: 'Maya',
    tone: 'gold' as const,
    statusLabel: 'Confirmed',
  },
  {
    id: 'evt-2',
    time: '3:15 PM',
    clientName: 'Devon R.',
    serviceName: "Men's Cut",
    staffName: 'Alex',
    tone: 'blue' as const,
    statusLabel: 'Confirmed',
  },
  {
    id: 'evt-3',
    time: '5:00 PM',
    clientName: 'Priya N.',
    serviceName: 'Gel Manicure',
    staffName: 'Jordan',
    tone: 'royal' as const,
    statusLabel: 'Pending',
  },
];

const staffMembers = [
  {
    id: 'staff-1',
    name: 'Maya Chen',
    role: 'Senior Colorist',
    revenueLabel: '$5,240',
    appointmentCount: 38,
    performancePercent: 96,
    trendLabel: '+12%',
    trendDirection: 'up' as const,
  },
  {
    id: 'staff-2',
    name: 'Alex Rivera',
    role: 'Barber',
    revenueLabel: '$4,180',
    appointmentCount: 41,
    performancePercent: 88,
    trendLabel: '+4%',
    trendDirection: 'up' as const,
  },
  {
    id: 'staff-3',
    name: 'Jordan Lee',
    role: 'Nail Technician',
    revenueLabel: '$3,020',
    appointmentCount: 29,
    performancePercent: 71,
    trendLabel: '-3%',
    trendDirection: 'down' as const,
  },
];

const recentActivities = [
  {
    id: 'act-1',
    title: 'Payment received',
    description: 'Sarah K. paid $185 for Balayage Color.',
    timeLabel: '12m ago',
    actorName: 'Front Desk',
    tone: 'green' as const,
    statusLabel: 'Paid',
  },
  {
    id: 'act-2',
    title: 'Appointment rescheduled',
    description: 'Devon R. moved from Tue 10 AM to Wed 3:15 PM.',
    timeLabel: '1h ago',
    actorName: 'Alex',
    tone: 'blue' as const,
  },
  {
    id: 'act-3',
    title: 'New client booked',
    description: 'Priya N. booked a Gel Manicure for Friday.',
    timeLabel: '3h ago',
    actorName: 'Online Booking',
    tone: 'royal' as const,
    statusLabel: 'New',
  },
];

/**
 * DashboardV2Composition — final responsive assembly of the nine approved
 * Dashboard V2 components. Composition only: no new components, no new
 * design tokens, no business logic. Layout switches on measured window
 * width — phone (single column) → tablet (two-column sections) →
 * desktop (executive grid: primary content + right rail).
 */
function DashboardV2Composition() {
  const router = useRouter();
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { locale } = useAppPreferences();
  const {
    summary,
    analytics,
    loading,
    refreshing,
    error,
    refresh,
  } = useAnalyticsData(token, clearToken);
  const { width } = useWindowDimensions();

  const dataPending = booting || loading;
  const displayValue = (value: number | undefined) =>
    dataPending ? '—' : String(value ?? 0);

  const ownerFirstName =
    sessionEmail?.split('@')[0]?.trim() || 'Owner';

  const totalBookings = summary?.total_appointments ?? 0;
  const completedBookings = summary?.completed_appointments ?? 0;
  const todayBookings = summary?.today_appointments ?? 0;

  const completionRate =
    totalBookings > 0
      ? Math.round((completedBookings / totalBookings) * 100)
      : 0;

  const realKpiData = [
    {
      label: 'Clients',
      value: displayValue(summary?.total_clients),
      trendLabel: dataPending ? 'Syncing' : 'Live',
      trendDirection: 'flat' as const,
      helperText: error ? 'Data unavailable' : 'Client base',
      accent: 'gold' as const,
      sparklineData: undefined,
    },
    {
      label: 'Services',
      value: displayValue(summary?.total_services),
      trendLabel: dataPending ? 'Syncing' : 'Live',
      trendDirection: 'flat' as const,
      helperText: error ? 'Data unavailable' : 'Active catalog',
      accent: 'royal' as const,
      sparklineData: undefined,
    },
    {
      label: 'Bookings',
      value: displayValue(summary?.total_appointments),
      trendLabel: dataPending ? 'Syncing' : `${completionRate}% done`,
      trendDirection: completionRate >= 60 ? 'up' as const : 'flat' as const,
      helperText: error ? 'Data unavailable' : 'Total demand',
      accent: 'blue' as const,
      sparklineData: undefined,
    },
    {
      label: 'Today',
      value: displayValue(summary?.today_appointments),
      trendLabel: dataPending ? 'Syncing' : 'Live',
      trendDirection: todayBookings > 0 ? 'up' as const : 'flat' as const,
      helperText: error ? 'Data unavailable' : 'Today activity',
      accent: 'green' as const,
      sparklineData: undefined,
    },
  ];

  const quickActions = quickActionBlueprints.map((action) => {
    switch (action.id) {
      case 'clients':
        return {
          ...action,
          onPress: () => router.push('/(tabs)/clients' as Href),
        };

      case 'services':
        return {
          ...action,
          onPress: () => router.push('/(tabs)/services' as Href),
        };

      case 'bookings':
        return {
          ...action,
          onPress: () => router.push('/(tabs)/appointments' as Href),
        };

      case 'reports':
        return {
          ...action,
          onPress: () => router.push('/(tabs)/reports' as Href),
        };

      case 'settings':
        return {
          ...action,
          onPress: () => router.push('/(tabs)/explore' as Href),
        };

      case 'analytics':
        return {
          ...action,
          onPress: () => router.push('/(tabs)/analytics' as Href),
        };

      default:
        return action;
    }
  });
  const device = classifyDevice(width);
  const isPhone = device === 'phone';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';

  const kpiColumns = isPhone ? 2 : isTablet ? 3 : 4;
  const kpiCellWidth = `${100 / kpiColumns}%`;
  const pagePadding = isPhone ? 16 : isTablet ? 28 : 40;

  const revenueCurrency = normalizeRevenueCurrency(
    analytics?.currency
  );

  const revenueSeries = (
    analytics?.revenue_last_7_days ?? []
  )
    .filter((point) => {
      const value = Number(point.completed_revenue);
      const date = new Date(`${point.date}T00:00:00`);

      return (
        Number.isFinite(value) &&
        Number.isFinite(date.getTime())
      );
    })
    .slice()
    .sort((first, second) =>
      first.date.localeCompare(second.date)
    )
    .map((point) => ({
      label: formatRevenueDateLabel(point.date, locale),
      value: Number(point.completed_revenue),
    }));

  const revenueLast7DaysTotal = revenueSeries.reduce(
    (total, point) => total + point.value,
    0
  );

  const todayRevenue =
    analytics?.revenue_last_7_days?.find(
      (point) => point.date === getLocalDateKey()
    )?.completed_revenue ?? 0;

  const revenueReady =
    !loading &&
    !error &&
    analytics !== null;

  const revenueTotalLabel = revenueReady
    ? formatMoney(
        revenueLast7DaysTotal,
        revenueCurrency,
        locale
      )
    : '—';

  const revenueTodayLabel = revenueReady
    ? formatMoney(
        Number(todayRevenue),
        revenueCurrency,
        locale
      )
    : '—';

  const revenueStatusLabel = loading
    ? 'Synchronizing'
    : error
      ? 'Revenue unavailable'
      : revenueSeries.length > 0
        ? 'Actual completed revenue'
        : 'No completed revenue';

  const greeting = (
    <ExecutiveGreetingV2
      ownerFirstName={ownerFirstName}
      salonName="SalonFlowAI"
      businessHealth={{
        label: error
          ? 'Needs Attention'
          : dataPending
            ? 'Synchronizing'
            : totalBookings > 0
              ? 'Live'
              : 'Ready',
        tone: error ? 'negative' : dataPending ? 'neutral' : 'positive',
      }}
      revenueToday={{
        amount: revenueTodayLabel,
        trendLabel: revenueReady
          ? 'Completed today'
          : revenueStatusLabel,
        trendDirection: 'flat',
      }}
      aiConfidence={{
        value: error ? 0 : dataPending ? 0 : 94,
        label: error
          ? 'Summary unavailable'
          : dataPending
            ? 'Synchronizing live data'
            : 'Summary connected',
      }}
      appointmentPulse={{
        completed: completedBookings,
        total: totalBookings,
        nextClientName: undefined,
        nextTime: todayBookings > 0
          ? `${todayBookings} today`
          : undefined,
      }}
    />
  );

  const kpiGrid = (
    <View style={styles.kpiGrid}>
      {realKpiData.map((kpi) => (
        <View key={kpi.label} style={[styles.kpiCell, { width: kpiCellWidth as any }]}>
          <KPICardV2 {...kpi} compact={isPhone} />
        </View>
      ))}
    </View>
  );

  const revenueSection = (
    <RevenueAnalyticsV2
      title="Revenue Overview"
      periodLabel="Last 7 Days"
      totalValue={revenueTotalLabel}
      trendLabel={revenueStatusLabel}
      trendDirection="flat"
      currentSeries={revenueSeries}
      currentSeriesLabel="Completed Revenue"
      axisValueFormatter={(value) =>
        formatCompactRevenue(
          value,
          revenueCurrency,
          locale
        )
      }
    />
  );

  const appointmentSegments = summary
    ? [
        {
          label: 'Completed',
          value: summary.completed_appointments,
          tone: 'completed' as const,
        },
        {
          label: 'Scheduled',
          value: summary.scheduled_appointments,
          tone: 'scheduled' as const,
        },
        {
          label: 'Cancelled',
          value: summary.cancelled_appointments,
          tone: 'cancelled' as const,
        },
      ]
    : [];

  const appointmentSection = (
    <AppointmentAnalyticsV2
      title="Appointments"
      totalAppointments={summary?.total_appointments ?? 0}
      periodLabel="Summary"
      segments={appointmentSegments}
    />
  );

  const aiSection = (
    <AICommandCenterV2
      healthLabel="Thriving"
      aiScore={86}
      confidenceLabel="94% confidence, based on the last 30 days of bookings and revenue."
      todaysFocus={[
        {
          time: '2:30 PM',
          label: "Confirm Sarah K.'s color appointment",
          detail: 'High no-show risk based on booking history.',
          tone: 'warning',
        },
        {
          time: '5:00 PM',
          label: 'Follow up with 3 clients overdue for rebooking',
          detail: 'Retention window closes this week.',
          tone: 'neutral',
        },
      ]}
      forecast={{
        headline: 'Revenue trending 12% above forecast this week.',
        helperText: 'Driven by strong Friday and Saturday bookings.',
        trendLabel: '+12%',
        trendDirection: 'up',
        series: [
          { label: 'Mon', value: 1800 },
          { label: 'Tue', value: 2100 },
          { label: 'Wed', value: 1950 },
          { label: 'Thu', value: 2400 },
          { label: 'Fri', value: 2900 },
          { label: 'Sat', value: 3200 },
          { label: 'Sun', value: 2600 },
        ],
      }}
      insights={[
        {
          title: 'Peak hours shifting later',
          description: 'Saturday demand is now heaviest between 1–4 PM, up from 11 AM–1 PM last quarter.',
          tone: 'neutral',
        },
        {
          title: '3 empty slots tomorrow',
          description: '10 AM, 11:30 AM, and 3 PM are open with no waitlist match yet.',
          tone: 'warning',
        },
      ]}
      recommendations={[
        'Send a rebooking reminder to clients inactive for 45+ days.',
        'Offer the 10 AM slot to your waitlist before end of day.',
      ]}
    />
  );

  const quickActionsSection = <QuickActionsV2 title="Quick Actions" actions={quickActions} />;

  const calendarSection = (
    <CalendarSnapshotV2
      title="Calendar Snapshot"
      dateLabel="June 6, 2026"
      events={calendarEvents}
      emptyLabel="No appointments scheduled for the rest of today."
    />
  );

  const staffSection = (
    <StaffPerformanceV2
      title="Staff Performance"
      periodLabel="This Month"
      staff={staffMembers}
      emptyLabel="No staff performance data for this period."
    />
  );

  const activitySection = (
    <RecentActivityV2
      title="Recent Activity"
      activities={recentActivities}
      emptyLabel="No recent activity to show."
    />
  );

  return (
    <RoyalCosmosBackground style={styles.cosmosShell}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: pagePadding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#7C5CFF"
            />
          }
        >
        <View style={isDesktop ? styles.pageInnerDesktop : styles.pageInner}>
          <View style={styles.sectionGap}>{greeting}</View>
          <View style={styles.sectionGap}>{kpiGrid}</View>

          {isPhone && (
            <>
              <View style={styles.sectionGap}>{revenueSection}</View>
              <View style={styles.sectionGap}>{appointmentSection}</View>
              <View style={styles.sectionGap}>{aiSection}</View>
              <View style={styles.sectionGap}>{quickActionsSection}</View>
              <View style={styles.sectionGap}>{calendarSection}</View>
              <View style={styles.sectionGap}>{staffSection}</View>
              <View style={styles.sectionGap}>{activitySection}</View>
            </>
          )}

          {isTablet && (
            <>
              <View style={[styles.twoColRow, styles.sectionGap]}>
                <View style={styles.twoColCell}>{revenueSection}</View>
                <View style={styles.twoColCell}>{appointmentSection}</View>
              </View>
              <View style={styles.sectionGap}>{aiSection}</View>
              <View style={styles.sectionGap}>{quickActionsSection}</View>
              <View style={[styles.twoColRow, styles.sectionGap]}>
                <View style={styles.twoColCell}>{calendarSection}</View>
                <View style={styles.twoColCell}>{staffSection}</View>
              </View>
              <View style={styles.sectionGap}>{activitySection}</View>
            </>
          )}

          {isDesktop && (
            <View style={styles.executiveGrid}>
              <View style={styles.primaryCol}>
                <View style={styles.sectionGap}>{revenueSection}</View>
                <View style={styles.sectionGap}>{quickActionsSection}</View>
                <View style={[styles.twoColRow, styles.sectionGap]}>
                  <View style={styles.twoColCell}>{calendarSection}</View>
                  <View style={styles.twoColCell}>{staffSection}</View>
                </View>
                <View>{activitySection}</View>
              </View>

              <View style={styles.rightRail}>
                <View style={styles.sectionGap}>{appointmentSection}</View>
                <View>{aiSection}</View>
              </View>
            </View>
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  cosmosShell: {
    flex: 1,
    backgroundColor: '#040508',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageInner: {
    width: '100%',
  },
  pageInnerDesktop: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  sectionGap: {
    marginBottom: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  kpiCell: {
    padding: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  twoColCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  executiveGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  primaryCol: {
    flex: 2,
    minWidth: 0,
    marginRight: 20,
  },
  rightRail: {
    flex: 1,
    minWidth: 280,
  },
});

export default DashboardV2Composition;
