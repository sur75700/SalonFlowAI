import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import ExecutiveGreetingV2 from './ExecutiveGreetingV2';
import KPICardV2 from './KPICardV2';
import RevenueAnalyticsV2 from './RevenueAnalyticsV2';
import AppointmentAnalyticsV2 from './AppointmentAnalyticsV2';
import AICommandCenterV2 from './AICommandCenterV2';
import { useIntelligenceDecision } from '../../../hooks/useIntelligenceDecision';
import {
  buildAICommandCenterLiveModel,
  buildIntelligenceDecisionRequest,
} from './ai-command-center-live-model';
import QuickActionsV2 from './QuickActionsV2';
import CalendarSnapshotV2 from './CalendarSnapshotV2';
import RoyalCosmosBackground from '../../ui/RoyalCosmosBackground';
import { useSession } from '../../../hooks/useSession';
import { useLogout } from '../../../hooks/useLogout';
import { useAppLanguage } from '../../../contexts/LanguageContext';
import {
  languageLabels,
  type AppLanguage,
  t as translate,
} from '../../../lib/i18n';
import { useAnalyticsData } from '../../../hooks/useDashboardData';
import { useAppointmentsData } from '../../../hooks/useResourceData';
import type { AppointmentItem } from '../../../types/models';
import { useAppPreferences } from '../../../hooks/useAppPreferences';
import { useBilling } from '../../../contexts/BillingContext';
import { formatMoney } from '../../../utils/money';
import type { AppCurrency } from '../../../lib/i18n/types';

type DeviceClass = 'phone' | 'tablet' | 'desktop';

type RevenuePeriod = '7d' | '30d' | '90d';
type AppointmentPeriod =
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'all';

const REVENUE_PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
] as const;

const APPOINTMENT_PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
] as const;

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

type DashboardAITone =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'danger';

type DashboardTrendDirection =
  | 'up'
  | 'down'
  | 'flat';

function clampDashboardScore(
  value: number | null | undefined
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function mapDashboardAITone(
  value: string | null | undefined
): DashboardAITone {
  const tone = value?.trim().toLowerCase();

  if (
    tone === 'positive' ||
    tone === 'success' ||
    tone === 'good'
  ) {
    return 'positive';
  }

  if (
    tone === 'danger' ||
    tone === 'critical' ||
    tone === 'high'
  ) {
    return 'danger';
  }

  if (
    tone === 'warning' ||
    tone === 'medium' ||
    tone === 'risk'
  ) {
    return 'warning';
  }

  return 'neutral';
}

function mapDashboardTrend(
  value: string | null | undefined
): DashboardTrendDirection {
  const trend = value?.trim().toLowerCase();

  if (
    trend === 'up' ||
    trend === 'growing' ||
    trend === 'positive' ||
    trend === 'increase'
  ) {
    return 'up';
  }

  if (
    trend === 'down' ||
    trend === 'declining' ||
    trend === 'negative' ||
    trend === 'decrease'
  ) {
    return 'down';
  }

  return 'flat';
}

function isValidAppointmentTimestamp(
  value: string | null | undefined
): value is string {
  if (!value) return false;

  return Number.isFinite(new Date(value).getTime());
}

function isAppointmentToday(value: string): boolean {
  const appointmentDate = new Date(value);
  const today = new Date();

  return (
    appointmentDate.getFullYear() === today.getFullYear() &&
    appointmentDate.getMonth() === today.getMonth() &&
    appointmentDate.getDate() === today.getDate()
  );
}

function formatCalendarDate(locale: string): string {
  const today = new Date();

  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(today);
  } catch {
    return today.toDateString();
  }
}

function formatCalendarTime(
  value: string,
  locale: string
): string {
  const date = new Date(value);

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

type CalendarCopy = {
  completed: string;
  cancelled: string;
  scheduled: string;
  unknown: string;
  unknownClient: string;
  serviceNotSpecified: string;
};

function mapCalendarStatus(
  statusValue: string,
  copy: CalendarCopy
) {
  const status = statusValue.trim().toLowerCase();

  switch (status) {
    case 'completed':
      return {
        statusLabel: copy.completed,
        tone: 'green' as const,
      };

    case 'cancelled':
      return {
        statusLabel: copy.cancelled,
        tone: 'red' as const,
      };

    case 'scheduled':
      return {
        statusLabel: copy.scheduled,
        tone: 'blue' as const,
      };

    default:
      return {
        statusLabel: status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : copy.unknown,
        tone: 'royal' as const,
      };
  }
}

function buildRealCalendarEvents(
  appointments: AppointmentItem[],
  locale: string,
  copy: CalendarCopy
) {
  return appointments
    .filter(
      (appointment) =>
        isValidAppointmentTimestamp(appointment.starts_at) &&
        isAppointmentToday(appointment.starts_at)
    )
    .slice()
    .sort(
      (first, second) =>
        new Date(first.starts_at).getTime() -
        new Date(second.starts_at).getTime()
    )
    .map((appointment) => {
      const status = mapCalendarStatus(
        appointment.status,
        copy
      );

      return {
        id: appointment.id,
        time: formatCalendarTime(
          appointment.starts_at,
          locale
        ),
        clientName:
          appointment.client_name?.trim() ||
          copy.unknownClient,
        serviceName:
          appointment.service_name?.trim() ||
          copy.serviceNotSpecified,
        statusLabel: status.statusLabel,
        tone: status.tone,
      };
    });
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


/**
 * DashboardV2Composition — final responsive assembly of the nine approved
 * Dashboard V2 components. Composition only: no new components, no new
 * design tokens, no business logic. Layout switches on measured window
 * width — phone (single column) → tablet (two-column sections) →
 * desktop (executive grid: primary content + right rail).
 */
function DashboardV2Composition() {
  const router = useRouter();

  const [revenuePeriod, setRevenuePeriod] =
    React.useState<RevenuePeriod>('7d');

  const [appointmentPeriod, setAppointmentPeriod] =
    React.useState<AppointmentPeriod>('all');
  const {
    token,
    booting,
    clearToken,
    sessionEmail,
  } = useSession();

  const { logout, loggingOut } = useLogout();

  const {
    language,
    setLanguage,
    t,
  } = useAppLanguage();

  const dashboardCopy = t.dashboardV2;

  const revenuePeriodOptions = [
    { value: '7d', label: dashboardCopy.periods.last7Days },
    { value: '30d', label: dashboardCopy.periods.last30Days },
    { value: '90d', label: dashboardCopy.periods.last90Days },
  ] as const;

  const appointmentPeriodOptions = [
    { value: 'today', label: dashboardCopy.periods.today },
    { value: '7d', label: dashboardCopy.periods.last7Days },
    { value: '30d', label: dashboardCopy.periods.last30Days },
    { value: '90d', label: dashboardCopy.periods.last90Days },
    { value: 'all', label: dashboardCopy.periods.allTime },
  ] as const;

  const translateRuntimeAIText = (
    value: string | null | undefined
  ): string | undefined => {
    const original = value?.trim();

    if (!original) return undefined;

    const normalized = original.toLowerCase();
    const dictionaryTranslation = translate(original, language);

    if (dictionaryTranslation !== original) {
      return dictionaryTranslation;
    }

    if (normalized.includes('capture growth opportunity')) {
      return dashboardCopy.ai.captureGrowthOpportunity;
    }

    if (
      normalized.includes(
        'increase bookings and completed revenue'
      )
    ) {
      return dashboardCopy.ai.increaseBookingsRevenue;
    }

    const leadingRevenueMatch = original.match(
      /^(.+?)\s+is leading revenue/i
    );

    if (leadingRevenueMatch?.[1]) {
      return dashboardCopy.ai.leadingRevenue.replace(
        '{service}',
        leadingRevenueMatch[1].trim()
      );
    }

    if (
      normalized.includes(
        'this service currently contributes the strongest'
      )
    ) {
      return dashboardCopy.ai.leadingRevenueDetail;
    }

    const generatedRevenueMatch = original.match(
      /^this service generated\s+(.+?)\s+across\s+(\d+)\s+bookings\.?$/i
    );

    if (generatedRevenueMatch) {
      return dashboardCopy.ai.generatedRevenueDetail
        .replace(
          '{amount}',
          generatedRevenueMatch[1].trim()
        )
        .replace(
          '{count}',
          generatedRevenueMatch[2]
        );
    }

    if (
      normalized.includes(
        'average completed ticket is visible'
      )
    ) {
      return dashboardCopy.ai.averageTicketVisible;
    }

    if (
      normalized.includes(
        'use this as the baseline for upsell'
      )
    ) {
      return dashboardCopy.ai.upsellBaseline;
    }

    return language === 'en' ? original : undefined;
  };

  const { locale } = useAppPreferences();
  const {
    summary,
    analytics,
    loading,
    refreshing,
    error,
    refresh,
  } = useAnalyticsData(token, clearToken);

  const {
    appointments,
    loading: appointmentsLoading,
    refreshing: appointmentsRefreshing,
    error: appointmentsError,
    refresh: refreshAppointments,
  } = useAppointmentsData(token, clearToken);

  const handleDashboardRefresh = () => {
    refresh();
    refreshAppointments();
    intelligenceDecision.refresh();
  };
  const { width } = useWindowDimensions();

  const dataPending = booting || loading;
  const displayValue = (value: number | undefined) =>
    dataPending ? '—' : String(value ?? 0);

  const ownerFirstName =
    sessionEmail?.split('@')[0]?.trim() || 'Owner';

  const accountInitials = ownerFirstName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'SF';

  const accountLanguageOptions = [
    {
      value: 'en',
      label: languageLabels.en,
      flag: '🇺🇸',
    },
    {
      value: 'hy',
      label: languageLabels.hy,
      flag: '🇦🇲',
    },
    {
      value: 'ru',
      label: languageLabels.ru,
      flag: '🇷🇺',
    },
    {
      value: 'fr',
      label: languageLabels.fr,
      flag: '🇫🇷',
    },
  ] as const;

  const totalBookings = summary?.total_appointments ?? 0;
  const completedBookings = summary?.completed_appointments ?? 0;
  const todayBookings = summary?.today_appointments ?? 0;

  const completionRate =
    totalBookings > 0
      ? Math.round((completedBookings / totalBookings) * 100)
      : 0;

  const realKpiData = [
    {
      label: dashboardCopy.kpi.clients,
      value: displayValue(summary?.total_clients),
      trendLabel: dataPending ? dashboardCopy.common.syncing : dashboardCopy.common.live,
      trendDirection: 'flat' as const,
      helperText: error ? dashboardCopy.kpi.dataUnavailable : dashboardCopy.kpi.clientBase,
      accent: 'gold' as const,
      sparklineData: undefined,
    },
    {
      label: dashboardCopy.kpi.services,
      value: displayValue(summary?.total_services),
      trendLabel: dataPending ? dashboardCopy.common.syncing : dashboardCopy.common.live,
      trendDirection: 'flat' as const,
      helperText: error ? dashboardCopy.kpi.dataUnavailable : dashboardCopy.kpi.activeCatalog,
      accent: 'royal' as const,
      sparklineData: undefined,
    },
    {
      label: dashboardCopy.kpi.bookings,
      value: displayValue(summary?.total_appointments),
      trendLabel: dataPending
        ? dashboardCopy.common.syncing
        : dashboardCopy.ai.completionPercent.replace(
            '{value}',
            String(completionRate)
          ),
      trendDirection: completionRate >= 60 ? 'up' as const : 'flat' as const,
      helperText: error ? dashboardCopy.kpi.dataUnavailable : dashboardCopy.kpi.totalDemand,
      accent: 'blue' as const,
      sparklineData: undefined,
    },
    {
      label: dashboardCopy.kpi.today,
      value: displayValue(summary?.today_appointments),
      trendLabel: dataPending ? dashboardCopy.common.syncing : dashboardCopy.common.live,
      trendDirection: todayBookings > 0 ? 'up' as const : 'flat' as const,
      helperText: error ? dashboardCopy.kpi.dataUnavailable : dashboardCopy.kpi.todayActivity,
      accent: 'green' as const,
      sparklineData: undefined,
    },
  ];

  const quickActions = quickActionBlueprints.map((action) => {
    const localizedLabel =
      action.id === 'clients'
        ? dashboardCopy.actions.clients
        : action.id === 'services'
          ? dashboardCopy.actions.services
          : action.id === 'bookings'
            ? dashboardCopy.actions.bookings
            : action.id === 'reports'
              ? dashboardCopy.actions.reports
              : action.id === 'settings'
                ? dashboardCopy.actions.settings
                : action.id === 'analytics'
                  ? dashboardCopy.actions.analytics
                  : action.label;

    const localizedAction = {
      ...action,
      label: localizedLabel,
    };

    switch (action.id) {
      case 'clients':
        return {
          ...localizedAction,
          onPress: () =>
            router.push('/(tabs)/clients' as Href),
        };

      case 'services':
        return {
          ...localizedAction,
          onPress: () =>
            router.push('/(tabs)/services' as Href),
        };

      case 'bookings':
        return {
          ...localizedAction,
          onPress: () =>
            router.push('/(tabs)/appointments' as Href),
        };

      case 'reports':
        return {
          ...localizedAction,
          onPress: () =>
            router.push('/(tabs)/reports' as Href),
        };

      case 'settings':
        return {
          ...localizedAction,
          onPress: () =>
            router.push('/(tabs)/explore' as Href),
        };

      case 'analytics':
        return {
          ...localizedAction,
          onPress: () =>
            router.push('/(tabs)/analytics' as Href),
        };

      default:
        return localizedAction;
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

  const {
    billingStatus,
    billingLoading,
  } = useBilling();

  const intelligenceBillingKnown =
    billingStatus !== null && !billingLoading;

  const intelligenceFeatureGranted =
    billingStatus?.features?.includes('advanced_ai') === true;

  const intelligenceKnownDenied =
    intelligenceBillingKnown &&
    (
      billingStatus.status !== 'active' ||
      !intelligenceFeatureGranted
    );

  const intelligenceCurrency =
    analytics?.currency?.trim().toUpperCase();

  const intelligenceCurrencyReady =
    SUPPORTED_REVENUE_CURRENCIES.includes(
      intelligenceCurrency as AppCurrency
    );

  const intelligenceRequest = React.useMemo(
    () =>
      intelligenceCurrencyReady
        ? buildIntelligenceDecisionRequest(
            revenuePeriod,
            intelligenceCurrency as AppCurrency
          )
        : null,
    [
      intelligenceCurrency,
      intelligenceCurrencyReady,
      revenuePeriod,
    ]
  );

  const intelligenceDecision = useIntelligenceDecision({
    token: token ?? '',
    clearToken,
    request: token ? intelligenceRequest : null,
    enabled:
      !booting &&
      !loading &&
      !intelligenceKnownDenied &&
      Boolean(token) &&
      intelligenceRequest !== null,
  });

  const revenuePeriodDays =
    revenuePeriod === '7d'
      ? 7
      : revenuePeriod === '30d'
        ? 30
        : 90;

  const revenueStartDate = new Date();
  revenueStartDate.setHours(0, 0, 0, 0);
  revenueStartDate.setDate(
    revenueStartDate.getDate() -
      (revenuePeriodDays - 1)
  );

  const revenueByDate = new Map<string, number>();

  appointments
    .filter((appointment) => {
      const date = new Date(appointment.starts_at);
      const status = String(
        appointment.status ?? ''
      ).toLowerCase();

      return (
        status === 'completed' &&
        Number.isFinite(date.getTime()) &&
        date >= revenueStartDate
      );
    })
    .forEach((appointment) => {
      const date = new Date(appointment.starts_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const rawPrice = Number(
        appointment.price_snapshot ?? 0
      );

      const price = Number.isFinite(rawPrice)
        ? rawPrice
        : 0;

      revenueByDate.set(
        key,
        (revenueByDate.get(key) ?? 0) + price
      );
    });

  const revenueSeries = Array.from(
    { length: revenuePeriodDays },
    (_, index) => {
      const date = new Date(revenueStartDate);
      date.setDate(date.getDate() + index);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      return {
        label: formatRevenueDateLabel(key, locale),
        value: revenueByDate.get(key) ?? 0,
      };
    }
  );

  const revenueLast7DaysTotal = revenueSeries.reduce(
    (total, point) => total + point.value,
    0
  );

  const hasCompletedRevenue = revenueSeries.some(
    (point) => point.value > 0
  );

  const visibleRevenueSeries = hasCompletedRevenue
    ? revenueSeries
    : [];

  const todayRevenue =
    revenueByDate.get(getLocalDateKey()) ?? 0;

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
    ? dashboardCopy.common.syncing
    : error
      ? dashboardCopy.revenue.unavailable
      : hasCompletedRevenue
        ? dashboardCopy.revenue.actualCompletedRevenue
        : dashboardCopy.revenue.empty;

  const greeting = (
    <ExecutiveGreetingV2
      greetingLabels={{
        morning: dashboardCopy.hero.morning,
        afternoon: dashboardCopy.hero.afternoon,
        evening: dashboardCopy.hero.evening,
        salonPerformance: dashboardCopy.hero.salonPerformance,
      }}
      metricLabels={{
        revenueToday: dashboardCopy.hero.revenueToday,
        aiConfidence: dashboardCopy.hero.aiConfidence,
        appointmentPulse: dashboardCopy.hero.appointmentPulse,
        next: dashboardCopy.hero.next,
      }}
      accountLabels={{
        language: dashboardCopy.hero.language,
        settings: dashboardCopy.common.settings,
        signOut: dashboardCopy.common.signOut,
        signingOut: dashboardCopy.common.signingOut,
      }}
      ownerFirstName={ownerFirstName}
      salonName="SalonFlowAI"
      businessHealth={{
        label: error
          ? dashboardCopy.hero.needsAttention
          : dataPending
            ? dashboardCopy.common.syncing
            : totalBookings > 0
              ? dashboardCopy.common.live
              : dashboardCopy.common.ready,
        tone: error ? 'negative' : dataPending ? 'neutral' : 'positive',
      }}
      revenueToday={{
        amount: revenueTodayLabel,
        trendLabel: revenueReady
          ? dashboardCopy.hero.completedToday
          : revenueStatusLabel,
        trendDirection: 'flat',
      }}
      aiConfidence={{
        value: error ? 0 : dataPending ? 0 : 94,
        label: error
          ? dashboardCopy.hero.summaryUnavailable
          : dataPending
            ? dashboardCopy.hero.synchronizingLiveData
            : dashboardCopy.hero.summaryConnected,
      }}
      appointmentPulse={{
        completed: completedBookings,
        total: totalBookings,
        nextClientName: undefined,
        nextTime: todayBookings > 0
          ? `${todayBookings} ${dashboardCopy.periods.today}`
          : undefined,
      }}
      accountMenu={{
        email: sessionEmail || undefined,
        initials: accountInitials,
        languageLabel: languageLabels[language],
        languageOptions: accountLanguageOptions,
        selectedLanguage: language,
        onLanguageChange: (value) =>
          setLanguage(value as AppLanguage),
        onSettings: () =>
          router.push('/(tabs)/explore' as Href),
        onLogout: async () => {
          await logout();
          router.replace("/login");
        },
        loggingOut,
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

  const revenuePeriodLabel =
    revenuePeriodOptions.find(
      (option) => option.value === revenuePeriod
    )?.label ?? dashboardCopy.periods.last7Days;

  const revenueSection = (
    <RevenueAnalyticsV2
      title={dashboardCopy.revenue.title}
      periodLabel={revenuePeriodLabel}
      periodOptions={revenuePeriodOptions}
      selectedPeriod={revenuePeriod}
      onPeriodChange={(value) =>
        setRevenuePeriod(value as RevenuePeriod)
      }
      totalValue={revenueTotalLabel}
      trendLabel={revenueStatusLabel}
      trendDirection="flat"
      currentSeries={visibleRevenueSeries}
      currentSeriesLabel={dashboardCopy.revenue.completedRevenue}
      axisValueFormatter={(value) =>
        formatCompactRevenue(
          value,
          revenueCurrency,
          locale
        )
      }
    />
  );

  const appointmentNow = new Date();

  const filteredAppointments = appointments.filter(
    (appointment) => {
      const date = new Date(appointment.starts_at);

      if (!Number.isFinite(date.getTime())) {
        return false;
      }

      if (appointmentPeriod === 'all') {
        return true;
      }

      if (appointmentPeriod === 'today') {
        return (
          date.getFullYear() === appointmentNow.getFullYear() &&
          date.getMonth() === appointmentNow.getMonth() &&
          date.getDate() === appointmentNow.getDate()
        );
      }

      const days =
        appointmentPeriod === '7d'
          ? 7
          : appointmentPeriod === '30d'
            ? 30
            : 90;

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      return date >= start && date <= appointmentNow;
    }
  );

  const appointmentCounts =
    filteredAppointments.reduce(
      (counts, appointment) => {
        const status = String(
          appointment.status ?? ''
        ).toLowerCase();

        if (status === 'completed') {
          counts.completed += 1;
        } else if (status === 'scheduled') {
          counts.scheduled += 1;
        } else if (status === 'cancelled') {
          counts.cancelled += 1;
        }

        return counts;
      },
      {
        completed: 0,
        scheduled: 0,
        cancelled: 0,
      }
    );

  const appointmentSegments = [
    {
      label: dashboardCopy.appointments.completed,
      value: appointmentCounts.completed,
      tone: 'completed' as const,
    },
    {
      label: dashboardCopy.appointments.scheduled,
      value: appointmentCounts.scheduled,
      tone: 'scheduled' as const,
    },
    {
      label: dashboardCopy.appointments.cancelled,
      value: appointmentCounts.cancelled,
      tone: 'cancelled' as const,
    },
  ].filter((segment) => segment.value > 0);

  const appointmentPeriodLabel =
    appointmentPeriodOptions.find(
      (option) => option.value === appointmentPeriod
    )?.label ?? dashboardCopy.periods.allTime;

  const appointmentSection = (
    <AppointmentAnalyticsV2
      labels={{
        total: dashboardCopy.common.total,
        noData: dashboardCopy.common.noData,
        emptyPeriod: dashboardCopy.appointments.emptyPeriod,
        selectPeriod: dashboardCopy.appointments.selectPeriod,
      }}
      title={dashboardCopy.appointments.title}
      totalAppointments={filteredAppointments.length}
      periodLabel={appointmentPeriodLabel}
      periodOptions={appointmentPeriodOptions}
      selectedPeriod={appointmentPeriod}
      onPeriodChange={(value) =>
        setAppointmentPeriod(
          value as AppointmentPeriod
        )
      }
      segments={appointmentSegments}
    />
  );

  const intelligenceStatus =
    intelligenceKnownDenied
      ? 'not_entitled'
      : intelligenceDecision.status;

  const intelligenceModel =
    buildAICommandCenterLiveModel(
      intelligenceDecision.data,
      {
        translateText: translateRuntimeAIText,
        mapTone: mapDashboardAITone,
        confidenceLabels: {
          low: translate('Low', locale),
          medium: translate('Medium', locale),
          high: translate('High', locale),
        },
        fallbacks: {
          insightTitle: dashboardCopy.ai.businessInsight,
          insightDescription: dashboardCopy.ai.noInsightDetail,
          recommendationTitle:
            dashboardCopy.ai.businessPriority,
          recommendationDescription:
            dashboardCopy.ai.noInsightDetail,
          forecastHeadline: dashboardCopy.ai.forecast,
          forecastDescription:
            dashboardCopy.ai.noInsightDetail,
          forecastLabel: dashboardCopy.ai.forecast,
        },
        forecastLabels: {
          sevenDays: dashboardCopy.ai.sevenDays,
          thirtyDays: dashboardCopy.ai.thirtyDays,
        },
      }
    );

  const aiSection = (
    <AICommandCenterV2
      labels={{
        commandCenter: dashboardCopy.ai.commandCenter,
        score: dashboardCopy.ai.score,
        todaysFocus: dashboardCopy.ai.todaysFocus,
        forecast: dashboardCopy.ai.forecast,
        insights: dashboardCopy.ai.insights,
        recommendations: dashboardCopy.ai.recommendations,
        emptyFocus: dashboardCopy.ai.emptyFocus,
        emptyInsights: dashboardCopy.ai.emptyInsights,
        caughtUp: dashboardCopy.ai.caughtUp,
        loading: dashboardCopy.common.syncing,
        refreshing: dashboardCopy.common.syncing,
        unavailable: dashboardCopy.common.unavailable,
        retry: translate('Retry', locale),
        locked: translate(
          'Locked Feature Upgrade Note',
          locale
        ),
        upgrade: translate('Pricing Packages', locale),
      }}
      healthLabel={intelligenceModel.healthLabel}
      aiScore={clampDashboardScore(
        intelligenceModel.aiScore
      )}
      confidenceLabel={
        intelligenceModel.confidenceLabel
      }
      todaysFocus={intelligenceModel.todaysFocus}
      forecast={{
        ...intelligenceModel.forecast,
        trendDirection: mapDashboardTrend(
          intelligenceModel.forecast.trendDirection
        ),
      }}
      insights={intelligenceModel.insights}
      recommendations={
        intelligenceModel.recommendations
      }
      status={intelligenceStatus}
      onRetry={intelligenceDecision.refresh}
      onUpgrade={() =>
        router.push('/(tabs)/explore' as Href)
      }
    />
  );

  const quickActionsSection = (
    <QuickActionsV2
      title={dashboardCopy.actions.title}
      emptyLabel={dashboardCopy.actions.empty}
      actions={quickActions}
    />
  );

  const calendarEvents = buildRealCalendarEvents(
    appointments,
    locale,
    {
      completed: dashboardCopy.appointments.completed,
      cancelled: dashboardCopy.appointments.cancelled,
      scheduled: dashboardCopy.appointments.scheduled,
      unknown: dashboardCopy.common.unknown,
      unknownClient: dashboardCopy.appointments.unknownClient,
      serviceNotSpecified:
        dashboardCopy.appointments.serviceNotSpecified,
    }
  );

  const calendarEmptyLabel = appointmentsLoading
    ? dashboardCopy.appointments.loading
    : appointmentsError
      ? dashboardCopy.appointments.unavailable
      : dashboardCopy.appointments.emptyToday;

  const calendarSection = (
    <CalendarSnapshotV2
      title={dashboardCopy.calendar.title}
      dateLabel={formatCalendarDate(locale)}
      events={calendarEvents}
      emptyLabel={calendarEmptyLabel}
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
              refreshing={refreshing || appointmentsRefreshing}
              onRefresh={handleDashboardRefresh}
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
              <View style={styles.sectionGap}>{calendarSection}</View>
            </>
          )}

          {isDesktop && (
            <View style={styles.executiveGrid}>
              <View style={styles.primaryCol}>
                <View style={styles.sectionGap}>{revenueSection}</View>
                <View style={styles.sectionGap}>{quickActionsSection}</View>
                <View style={styles.sectionGap}>{calendarSection}</View>
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
