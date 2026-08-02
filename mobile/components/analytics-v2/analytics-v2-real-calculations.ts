import type {
  AppCurrency,
  AppLocale,
} from "../../lib/i18n/types";
import type {
  AppointmentItem,
  ClientItem,
  ServiceItem,
} from "../../types/models";

import type {
  AnalyticsActionPreview,
  AnalyticsPeriodKey,
  AnalyticsPreviewModel,
  AnalyticsRevenuePoint,
  AnalyticsServicePreview,
  AnalyticsTone,
} from "./analytics-v2-types";

const DAY_MS = 24 * 60 * 60 * 1000;

const PERIOD_DAYS: Record<
  AnalyticsPeriodKey,
  number
> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const SERVICE_TONES: AnalyticsTone[] = [
  "violet",
  "gold",
  "emerald",
  "cyan",
  "rose",
];

export type BuildRealAnalyticsInput = {
  appointments: AppointmentItem[];
  clients: ClientItem[];
  services: ServiceItem[];
  currency: AppCurrency;
  locale: AppLocale;
  generatedAt?: number;
};

export type RealAnalyticsPeriodModels = Record<
  AnalyticsPeriodKey,
  AnalyticsPreviewModel
>;

type NormalizedAppointment = {
  source: AppointmentItem;
  timestamp: number;
  status: string;
  price: number;
  currency: string;
};

type PeriodSnapshot = {
  appointments: NormalizedAppointment[];
  completedRevenue: number;
  scheduledValue: number;
  cancelledValue: number;
  totalBookings: number;
  completedCount: number;
  scheduledCount: number;
  cancelledCount: number;
  otherCount: number;
  averageTicket: number;
  cancellationRate: number;
  completionRate: number;
  activeClientIds: Set<string>;
  returningClientIds: Set<string>;
  newClientIds: Set<string>;
  atRiskClientIds: Set<string>;
  highValueClientIds: Set<string>;
};

function safeNumber(value: unknown): number {
  const numeric = Number(value);

  return Number.isFinite(numeric)
    ? numeric
    : 0;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function normalizedStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function parseTimestamp(
  value: string | null | undefined
): number | null {
  if (!value) return null;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}

function compactMoney(
  value: number,
  currency: AppCurrency,
  locale: AppLocale
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

function percent(value: number): string {
  return `${Math.round(value)}%`;
}

function effectiveCurrency(
  appointment: AppointmentItem,
  servicesById: Map<string, ServiceItem>,
  fallback: AppCurrency
): string {
  if (appointment.currency_snapshot) {
    return appointment.currency_snapshot;
  }

  if (appointment.service_id) {
    const service = servicesById.get(
      appointment.service_id
    );

    if (service?.currency) {
      return service.currency;
    }
  }

  return fallback;
}

function normalizeAppointments(
  appointments: AppointmentItem[],
  services: ServiceItem[],
  currency: AppCurrency
): {
  included: NormalizedAppointment[];
  excludedCurrencyCount: number;
  invalidDateCount: number;
} {
  const servicesById = new Map(
    services.map((service) => [
      service.id,
      service,
    ])
  );

  const included: NormalizedAppointment[] = [];
  let excludedCurrencyCount = 0;
  let invalidDateCount = 0;

  appointments.forEach((appointment) => {
    const timestamp = parseTimestamp(
      appointment.starts_at
    );

    if (timestamp === null) {
      invalidDateCount += 1;
      return;
    }

    const appointmentCurrency =
      effectiveCurrency(
        appointment,
        servicesById,
        currency
      );

    if (appointmentCurrency !== currency) {
      excludedCurrencyCount += 1;
      return;
    }

    included.push({
      source: appointment,
      timestamp,
      status: normalizedStatus(
        appointment.status
      ),
      price: safeNumber(
        appointment.price_snapshot
      ),
      currency: appointmentCurrency,
    });
  });

  return {
    included,
    excludedCurrencyCount,
    invalidDateCount,
  };
}

function rangeFilter(
  appointments: NormalizedAppointment[],
  start: number,
  end: number
): NormalizedAppointment[] {
  return appointments.filter(
    (appointment) =>
      appointment.timestamp >= start &&
      appointment.timestamp < end
  );
}

function clientIds(
  appointments: NormalizedAppointment[],
  completedOnly = false
): Set<string> {
  const result = new Set<string>();

  appointments.forEach((appointment) => {
    if (
      completedOnly &&
      appointment.status !== "completed"
    ) {
      return;
    }

    const clientId = String(
      appointment.source.client_id || ""
    );

    if (clientId) {
      result.add(clientId);
    }
  });

  return result;
}

function setDifference(
  left: Set<string>,
  right: Set<string>
): Set<string> {
  return new Set(
    Array.from(left).filter(
      (item) => !right.has(item)
    )
  );
}

function setIntersection(
  left: Set<string>,
  right: Set<string>
): Set<string> {
  return new Set(
    Array.from(left).filter((item) =>
      right.has(item)
    )
  );
}

function buildSnapshot({
  allAppointments,
  currentAppointments,
  currentStart,
  previousStart,
  clients,
}: {
  allAppointments: NormalizedAppointment[];
  currentAppointments: NormalizedAppointment[];
  currentStart: number;
  previousStart: number;
  clients: ClientItem[];
}): PeriodSnapshot {
  const completedAppointments =
    currentAppointments.filter(
      (appointment) =>
        appointment.status === "completed"
    );

  const scheduledAppointments =
    currentAppointments.filter(
      (appointment) =>
        appointment.status === "scheduled"
    );

  const cancelledAppointments =
    currentAppointments.filter(
      (appointment) =>
        appointment.status === "cancelled"
    );

  const completedRevenue =
    completedAppointments.reduce(
      (total, appointment) =>
        total + appointment.price,
      0
    );

  const scheduledValue =
    scheduledAppointments.reduce(
      (total, appointment) =>
        total + appointment.price,
      0
    );

  const cancelledValue =
    cancelledAppointments.reduce(
      (total, appointment) =>
        total + appointment.price,
      0
    );

  const activeClientIds = clientIds(
    currentAppointments
  );

  const historicalClientIds = clientIds(
    allAppointments.filter(
      (appointment) =>
        appointment.timestamp < currentStart
    )
  );

  const returningClientIds =
    setIntersection(
      activeClientIds,
      historicalClientIds
    );

  const createdDuringPeriod = new Set(
    clients
      .filter((client) => {
        const createdAt = parseTimestamp(
          client.created_at
        );

        return (
          createdAt !== null &&
          createdAt >= currentStart
        );
      })
      .map((client) => client.id)
  );

  const firstSeenClientIds =
    setDifference(
      activeClientIds,
      historicalClientIds
    );

  const newClientIds = new Set([
    ...createdDuringPeriod,
    ...firstSeenClientIds,
  ]);

  const previousCompletedClients =
    clientIds(
      allAppointments.filter(
        (appointment) =>
          appointment.timestamp >=
            previousStart &&
          appointment.timestamp <
            currentStart
      ),
      true
    );

  const currentCompletedClients =
    clientIds(
      currentAppointments,
      true
    );

  const atRiskClientIds =
    setDifference(
      previousCompletedClients,
      currentCompletedClients
    );

  const revenueByClient = new Map<
    string,
    number
  >();

  completedAppointments.forEach(
    (appointment) => {
      const clientId = String(
        appointment.source.client_id || ""
      );

      if (!clientId) return;

      revenueByClient.set(
        clientId,
        (revenueByClient.get(clientId) ?? 0) +
          appointment.price
      );
    }
  );

  const averageTicket =
    completedAppointments.length > 0
      ? completedRevenue /
        completedAppointments.length
      : 0;

  const highValueThreshold =
    averageTicket > 0
      ? averageTicket * 2
      : Number.POSITIVE_INFINITY;

  const highValueClientIds = new Set(
    Array.from(revenueByClient.entries())
      .filter(
        ([, revenue]) =>
          revenue >= highValueThreshold
      )
      .map(([clientId]) => clientId)
  );

  const knownStatusCount =
    completedAppointments.length +
    scheduledAppointments.length +
    cancelledAppointments.length;

  return {
    appointments: currentAppointments,
    completedRevenue,
    scheduledValue,
    cancelledValue,
    totalBookings:
      currentAppointments.length,
    completedCount:
      completedAppointments.length,
    scheduledCount:
      scheduledAppointments.length,
    cancelledCount:
      cancelledAppointments.length,
    otherCount: Math.max(
      currentAppointments.length -
        knownStatusCount,
      0
    ),
    averageTicket,
    cancellationRate:
      currentAppointments.length > 0
        ? (cancelledAppointments.length /
            currentAppointments.length) *
          100
        : 0,
    completionRate:
      currentAppointments.length > 0
        ? (completedAppointments.length /
            currentAppointments.length) *
          100
        : 0,
    activeClientIds,
    returningClientIds,
    newClientIds,
    atRiskClientIds,
    highValueClientIds,
  };
}

function comparisonDelta(
  current: number,
  previous: number,
  lowerIsBetter = false
): {
  label: string;
  direction: "up" | "down" | "flat";
} {
  if (previous === 0) {
    if (current === 0) {
      return {
        label: "0.0%",
        direction: "flat",
      };
    }

    return {
      label: "New",
      direction: lowerIsBetter
        ? "down"
        : "up",
    };
  }

  const raw =
    ((current - previous) /
      Math.abs(previous)) *
    100;

  const improved = lowerIsBetter
    ? raw < 0
    : raw > 0;

  const worsened = lowerIsBetter
    ? raw > 0
    : raw < 0;

  return {
    label:
      `${raw >= 0 ? "+" : ""}` +
      `${raw.toFixed(1)}%`,
    direction: improved
      ? "up"
      : worsened
        ? "down"
        : "flat",
  };
}

function createSeries({
  appointments,
  currentStart,
  previousStart,
  end,
  days,
  locale,
}: {
  appointments: NormalizedAppointment[];
  currentStart: number;
  previousStart: number;
  end: number;
  days: number;
  locale: AppLocale;
}): {
  revenue: AnalyticsRevenuePoint[];
  bookings: number[];
  averageTicket: number[];
  cancellationRate: number[];
} {
  const bucketCount =
    days === 7
      ? 7
      : days === 30
        ? 10
        : 12;

  const periodDuration = end - currentStart;
  const bucketDuration =
    periodDuration / bucketCount;

  const currentRevenue =
    Array<number>(bucketCount).fill(0);

  const previousRevenue =
    Array<number>(bucketCount).fill(0);

  const bookings =
    Array<number>(bucketCount).fill(0);

  const completedValue =
    Array<number>(bucketCount).fill(0);

  const completedCount =
    Array<number>(bucketCount).fill(0);

  const cancelledCount =
    Array<number>(bucketCount).fill(0);

  appointments.forEach((appointment) => {
    if (
      appointment.timestamp >= currentStart &&
      appointment.timestamp < end
    ) {
      const currentIndex = clamp(
        Math.floor(
          (appointment.timestamp -
            currentStart) /
            bucketDuration
        ),
        0,
        bucketCount - 1
      );

      bookings[currentIndex] += 1;

      if (
        appointment.status === "completed"
      ) {
        currentRevenue[currentIndex] +=
          appointment.price;

        completedValue[currentIndex] +=
          appointment.price;

        completedCount[currentIndex] += 1;
      }

      if (
        appointment.status === "cancelled"
      ) {
        cancelledCount[currentIndex] += 1;
      }
    }

    if (
      appointment.timestamp >= previousStart &&
      appointment.timestamp < currentStart
    ) {
      const previousIndex = clamp(
        Math.floor(
          ((appointment.timestamp -
            previousStart) /
            periodDuration) *
            bucketCount
        ),
        0,
        bucketCount - 1
      );

      if (
        appointment.status === "completed"
      ) {
        previousRevenue[previousIndex] +=
          appointment.price;
      }
    }
  });

  const revenue = currentRevenue.map(
    (value, index) => {
      const bucketEnd = new Date(
        currentStart +
          bucketDuration * (index + 1)
      );

      const label =
        days === 7
          ? bucketEnd.toLocaleDateString(
              locale,
              {
                weekday: "short",
              }
            )
          : bucketEnd.toLocaleDateString(
              locale,
              {
                month: "short",
                day: "numeric",
              }
            );

      return {
        label,
        current: Math.round(value),
        previous: Math.round(
          previousRevenue[index]
        ),
      };
    }
  );

  return {
    revenue,
    bookings,
    averageTicket:
      completedValue.map(
        (value, index) =>
          completedCount[index] > 0
            ? value /
              completedCount[index]
            : 0
      ),
    cancellationRate:
      cancelledCount.map(
        (value, index) =>
          bookings[index] > 0
            ? (value /
                bookings[index]) *
              100
            : 0
      ),
  };
}

function buildServices(
  appointments: NormalizedAppointment[],
  services: ServiceItem[],
  currency: AppCurrency,
  locale: AppLocale
): AnalyticsServicePreview[] {
  const serviceNames = new Map(
    services.map((service) => [
      service.id,
      service.name,
    ])
  );

  const aggregates = new Map<
    string,
    {
      name: string;
      revenue: number;
      bookings: number;
    }
  >();

  appointments.forEach((appointment) => {
    const serviceId = String(
      appointment.source.service_id ||
        "unassigned"
    );

    const serviceName =
      appointment.source.service_name ||
      serviceNames.get(serviceId) ||
      "Unassigned service";

    const aggregate =
      aggregates.get(serviceId) ?? {
        name: serviceName,
        revenue: 0,
        bookings: 0,
      };

    if (
      appointment.status !== "cancelled"
    ) {
      aggregate.bookings += 1;
    }

    if (
      appointment.status === "completed"
    ) {
      aggregate.revenue +=
        appointment.price;
    }

    aggregates.set(
      serviceId,
      aggregate
    );
  });

  const ranked = Array.from(
    aggregates.entries()
  )
    .sort(
      (left, right) =>
        right[1].revenue -
          left[1].revenue ||
        right[1].bookings -
          left[1].bookings
    )
    .slice(0, 5);

  const maximumBookings = Math.max(
    ...ranked.map(
      ([, service]) =>
        service.bookings
    ),
    0
  );

  return ranked.map(
    ([id, service], index) => ({
      id,
      name: service.name,
      revenue: compactMoney(
        service.revenue,
        currency,
        locale
      ),
      bookings: service.bookings,
      share:
        maximumBookings > 0
          ? Math.round(
              (service.bookings /
                maximumBookings) *
                100
            )
          : 0,
      tone:
        SERVICE_TONES[
          index %
            SERVICE_TONES.length
        ],
    })
  );
}

function buildHeatmap(
  appointments: NormalizedAppointment[]
): number[][] {
  const raw = Array.from(
    { length: 7 },
    () => Array<number>(6).fill(0)
  );

  appointments.forEach((appointment) => {
    const date = new Date(
      appointment.timestamp
    );

    const weekday =
      (date.getDay() + 6) % 7;

    const hourIndex = clamp(
      Math.floor(
        (date.getHours() - 9) / 2
      ),
      0,
      5
    );

    raw[weekday][hourIndex] += 1;
  });

  const maximum = Math.max(
    ...raw.flat(),
    0
  );

  if (maximum === 0) {
    return raw.map((row) =>
      row.map(() => 1)
    );
  }

  return raw.map((row) =>
    row.map((value) =>
      value === 0
        ? 1
        : clamp(
            Math.ceil(
              (value / maximum) * 5
            ),
            2,
            5
          )
    )
  );
}

function buildModel({
  normalizedAppointments,
  clients,
  services,
  currency,
  locale,
  generatedAt,
  excludedCurrencyCount,
  invalidDateCount,
  period,
}: {
  normalizedAppointments:
    NormalizedAppointment[];
  clients: ClientItem[];
  services: ServiceItem[];
  currency: AppCurrency;
  locale: AppLocale;
  generatedAt: number;
  excludedCurrencyCount: number;
  invalidDateCount: number;
  period: AnalyticsPeriodKey;
}): AnalyticsPreviewModel {
  const days = PERIOD_DAYS[period];

  const end = generatedAt;
  const currentStart =
    end - days * DAY_MS;

  const previousStart =
    currentStart - days * DAY_MS;

  const currentAppointments =
    rangeFilter(
      normalizedAppointments,
      currentStart,
      end
    );

  const previousAppointments =
    rangeFilter(
      normalizedAppointments,
      previousStart,
      currentStart
    );

  const current = buildSnapshot({
    allAppointments:
      normalizedAppointments,
    currentAppointments,
    currentStart,
    previousStart,
    clients,
  });

  const previous = buildSnapshot({
    allAppointments:
      normalizedAppointments,
    currentAppointments:
      previousAppointments,
    currentStart: previousStart,
    previousStart:
      previousStart -
      days * DAY_MS,
    clients,
  });

  const series = createSeries({
    appointments:
      normalizedAppointments,
    currentStart,
    previousStart,
    end,
    days,
    locale,
  });

  const revenueDelta =
    comparisonDelta(
      current.completedRevenue,
      previous.completedRevenue
    );

  const bookingsDelta =
    comparisonDelta(
      current.totalBookings,
      previous.totalBookings
    );

  const currentRetention =
    current.activeClientIds.size > 0
      ? (current.returningClientIds.size /
          current.activeClientIds.size) *
        100
      : 0;

  const previousRetention =
    previous.activeClientIds.size > 0
      ? (previous.returningClientIds.size /
          previous.activeClientIds.size) *
        100
      : 0;

  const retentionDelta =
    comparisonDelta(
      currentRetention,
      previousRetention
    );

  const ticketDelta =
    comparisonDelta(
      current.averageTicket,
      previous.averageTicket
    );

  const cancellationDelta =
    comparisonDelta(
      current.cancellationRate,
      previous.cancellationRate,
      true
    );

  const growthPercent =
    previous.completedRevenue > 0
      ? ((current.completedRevenue -
          previous.completedRevenue) /
          previous.completedRevenue) *
        100
      : current.completedRevenue > 0
        ? 100
        : 0;

  const revenueHealth = clamp(
    50 + growthPercent * 1.5,
    0,
    100
  );

  const retentionHealth =
    current.activeClientIds.size > 0
      ? currentRetention
      : 50;

  const completionHealth =
    current.totalBookings > 0
      ? current.completionRate
      : 50;

  const riskHealth =
    100 -
    clamp(
      current.cancellationRate * 4,
      0,
      100
    );

  const salonHealthIndex =
    Math.round(
      revenueHealth * 0.3 +
        retentionHealth * 0.25 +
        completionHealth * 0.25 +
        riskHealth * 0.2
    );

  const aiStatus =
    salonHealthIndex >= 85
      ? "Excellent"
      : salonHealthIndex >= 70
        ? "Healthy"
        : salonHealthIndex >= 50
          ? "Needs attention"
          : "High priority";

  const serviceRanking =
    buildServices(
      current.appointments,
      services,
      currency,
      locale
    );

  const topService =
    serviceRanking[0] ?? null;

  const recoveryTicket = Math.max(
    current.averageTicket,
    previous.averageTicket
  );

  const reactivationOpportunity =
    current.atRiskClientIds.size *
    recoveryTicket;

  const topServiceRevenue =
    current.appointments
      .filter(
        (appointment) =>
          appointment.status ===
            "completed" &&
          String(
            appointment.source.service_id ||
              "unassigned"
          ) === topService?.id
      )
      .reduce(
        (total, appointment) =>
          total + appointment.price,
        0
      );

  const serviceGrowthOpportunity =
    topServiceRevenue * 0.15;

  const cancellationProtection =
    current.cancelledValue * 0.35;

  const averageTicketOpportunity =
    current.completedRevenue * 0.05;

  const confidence = clamp(
    55 +
      Math.min(
        current.totalBookings,
        35
      ),
    55,
    92
  );

  const actions:
    AnalyticsActionPreview[] = [
      {
        id: "a1",
        priority: "Critical",
        confidence,
        title:
          "Recover at-risk clients",
        description:
          current.atRiskClientIds.size > 0
            ? `${current.atRiskClientIds.size} previously completed clients have no completed appointment in the selected period.`
            : "No completed-client reactivation gap is visible in the selected period.",
        impact:
          `Potential recovery: ` +
          compactMoney(
            reactivationOpportunity,
            currency,
            locale
          ),
        actionLabel: "Review clients",
        tone: "rose",
        icon:
          "shield-checkmark-outline",
      },
      {
        id: "a2",
        priority: "Growth",
        confidence,
        title:
          "Scale your strongest service",
        description: topService
          ? `${topService.name} leads the selected period with ${topService.bookings} non-cancelled bookings.`
          : "No service has enough selected-period activity for a growth recommendation.",
        impact:
          `Growth opportunity: ` +
          compactMoney(
            serviceGrowthOpportunity,
            currency,
            locale
          ),
        actionLabel: "Review service",
        tone: "emerald",
        icon: "rocket-outline",
      },
      {
        id: "a3",
        priority: "High",
        confidence: clamp(
          confidence - 5,
          50,
          90
        ),
        title:
          "Reduce cancellation friction",
        description:
          current.cancelledCount > 0
            ? `${current.cancelledCount} cancelled appointments represent ${compactMoney(
                current.cancelledValue,
                currency,
                locale
              )} in appointment value.`
            : "No cancelled appointment value is present in the selected period.",
        impact:
          `Protected value: ` +
          compactMoney(
            cancellationProtection,
            currency,
            locale
          ),
        actionLabel: "Open playbook",
        tone: "gold",
        icon: "bulb-outline",
      },
    ];

  let primarySignal: string;
  let nextAction: string;

  if (current.totalBookings === 0) {
    primarySignal =
      "No appointment activity is available in the selected rolling period.";

    nextAction =
      "Create or import appointment activity before making a performance decision.";
  } else if (
    current.cancellationRate >= 15
  ) {
    primarySignal =
      `Cancellation exposure is ` +
      `${current.cancellationRate.toFixed(1)}% ` +
      "in the selected period.";

    nextAction =
      "Review cancellation timing and affected high-value appointments.";
  } else if (
    current.atRiskClientIds.size > 0 &&
    reactivationOpportunity >=
      serviceGrowthOpportunity
  ) {
    primarySignal =
      `${current.atRiskClientIds.size} previously active clients have no completed appointment in the selected period.`;

    nextAction =
      "Review the at-risk client segment and its booking rhythm.";
  } else if (
    topService &&
    serviceGrowthOpportunity > 0
  ) {
    primarySignal =
      `${topService.name} is the strongest selected-period service signal.`;

    nextAction =
      `Review capacity and growth potential for ${topService.name}.`;
  } else {
    primarySignal =
      "Selected-period activity is stable with no dominant risk signal.";

    nextAction =
      "Continue monitoring revenue, retention and cancellation behavior.";
  }

  const maximumOpportunity = Math.max(
    reactivationOpportunity,
    serviceGrowthOpportunity,
    cancellationProtection,
    averageTicketOpportunity
  );

  const updatedAt =
    new Date(
      generatedAt
    ).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const dataNotes: string[] = [];

  if (excludedCurrencyCount > 0) {
    dataNotes.push(
      `${excludedCurrencyCount} other-currency records excluded`
    );
  }

  if (invalidDateCount > 0) {
    dataNotes.push(
      `${invalidDateCount} invalid-date records excluded`
    );
  }

  dataNotes.push(
    `${current.totalBookings} appointments`
  );

  return {
    overline: "SALONFLOW AI · LIVE",
    title: "Salon Intelligence",
    subtitle:
      "Live appointment, client and service intelligence for the selected rolling period.",
    previewLabel:
      `Live data · ${period.toUpperCase()} window`,
    lastUpdated:
      `Updated ${updatedAt} · ` +
      dataNotes.join(" · "),

    kpis: [
      {
        id: "revenue",
        label: "Completed Revenue",
        value: compactMoney(
          current.completedRevenue,
          currency,
          locale
        ),
        delta: revenueDelta.label,
        context:
          `vs previous ${days} days`,
        tone: "emerald",
        icon: "cash-outline",
        direction:
          revenueDelta.direction,
        trend: series.revenue.map(
          (point) => point.current
        ),
      },
      {
        id: "bookings",
        label: "Bookings",
        value: String(
          current.totalBookings
        ),
        delta: bookingsDelta.label,
        context:
          `vs previous ${days} days`,
        tone: "violet",
        icon: "calendar-outline",
        direction:
          bookingsDelta.direction,
        trend: series.bookings,
      },
      {
        id: "clients",
        label: "Returning Clients",
        value: percent(
          currentRetention
        ),
        delta: retentionDelta.label,
        context:
          `${current.returningClientIds.size} returning of ${current.activeClientIds.size} active`,
        tone: "cyan",
        icon: "people-outline",
        direction:
          retentionDelta.direction,
        trend: series.bookings,
      },
      {
        id: "ticket",
        label: "Average Ticket",
        value: compactMoney(
          current.averageTicket,
          currency,
          locale
        ),
        delta: ticketDelta.label,
        context:
          `${current.completedCount} completed appointments`,
        tone: "gold",
        icon: "receipt-outline",
        direction:
          ticketDelta.direction,
        trend: series.averageTicket,
      },
      {
        id: "cancellation",
        label: "Cancellation Rate",
        value:
          `${current.cancellationRate.toFixed(1)}%`,
        delta:
          cancellationDelta.label,
        context:
          `${current.cancelledCount} cancelled appointments`,
        tone: "rose",
        icon: "warning-outline",
        direction:
          cancellationDelta.direction,
        trend:
          series.cancellationRate,
      },
      {
        id: "growth",
        label: "Business Growth",
        value:
          previous.completedRevenue > 0
            ? `${growthPercent >= 0 ? "+" : ""}${growthPercent.toFixed(1)}%`
            : current.completedRevenue > 0
              ? "New"
              : "0.0%",
        delta:
          salonHealthIndex >= 85
            ? "Excellent"
            : salonHealthIndex >= 70
              ? "Healthy"
              : "Review",
        context:
          "real completed-revenue comparison",
        tone: "green",
        icon: "trending-up-outline",
        direction:
          growthPercent > 0
            ? "up"
            : growthPercent < 0
              ? "down"
              : "flat",
        trend: series.revenue.map(
          (point) =>
            point.current -
            point.previous
        ),
      },
    ],

    revenueSeries: series.revenue,
    services: serviceRanking,

    statuses: [
      {
        id: "completed",
        label: "Completed",
        value:
          current.completedCount,
        tone: "emerald",
      },
      {
        id: "scheduled",
        label: "Scheduled",
        value:
          current.scheduledCount,
        tone: "violet",
      },
      {
        id: "cancelled",
        label: "Cancelled",
        value:
          current.cancelledCount,
        tone: "rose",
      },
      {
        id: "other",
        label: "Other",
        value: current.otherCount,
        tone: "gold",
      },
    ],

    clientSignals: [
      {
        id: "retention",
        label: "Retention",
        value: percent(
          currentRetention
        ),
        hint:
          `${current.returningClientIds.size} returning clients`,
        tone: "emerald",
      },
      {
        id: "new",
        label: "New Clients",
        value: String(
          current.newClientIds.size
        ),
        hint:
          "created or first seen during period",
        tone: "cyan",
      },
      {
        id: "at-risk",
        label: "At-risk Clients",
        value: String(
          current.atRiskClientIds.size
        ),
        hint:
          "completed previously, absent now",
        tone: "rose",
      },
      {
        id: "high-value",
        label: "High-value Clients",
        value: String(
          current.highValueClientIds.size
        ),
        hint:
          "at least twice average ticket",
        tone: "gold",
      },
    ],

    actions,

    opportunities: [
      {
        id: "o1",
        title: "Reactivate clients",
        impact: "High",
        effort: "Low",
        value: compactMoney(
          reactivationOpportunity,
          currency,
          locale
        ),
        tone: "emerald",
      },
      {
        id: "o2",
        title: topService
          ? `Scale ${topService.name}`
          : "Scale top service",
        impact: "High",
        effort: "Low",
        value: compactMoney(
          serviceGrowthOpportunity,
          currency,
          locale
        ),
        tone: "violet",
      },
      {
        id: "o3",
        title: "Reduce cancellations",
        impact: "High",
        effort: "High",
        value: compactMoney(
          cancellationProtection,
          currency,
          locale
        ),
        tone: "rose",
      },
      {
        id: "o4",
        title: "Raise average ticket",
        impact: "Medium",
        effort: "High",
        value: compactMoney(
          averageTicketOpportunity,
          currency,
          locale
        ),
        tone: "gold",
      },
    ],

    aiScore: salonHealthIndex,
    aiStatus,
    primarySignal,
    nextAction,
    expectedImpact:
      `Calculated opportunity: ` +
      compactMoney(
        maximumOpportunity,
        currency,
        locale
      ),

    heatmap: buildHeatmap(
      current.appointments
    ),
  };
}

export function buildRealAnalyticsPeriodModels(
  input: BuildRealAnalyticsInput
): RealAnalyticsPeriodModels {
  const generatedAt =
    input.generatedAt ?? Date.now();

  const normalized =
    normalizeAppointments(
      input.appointments,
      input.services,
      input.currency
    );

  const shared = {
    normalizedAppointments:
      normalized.included,
    clients: input.clients,
    services: input.services,
    currency: input.currency,
    locale: input.locale,
    generatedAt,
    excludedCurrencyCount:
      normalized.excludedCurrencyCount,
    invalidDateCount:
      normalized.invalidDateCount,
  };

  return {
    "7d": buildModel({
      ...shared,
      period: "7d",
    }),
    "30d": buildModel({
      ...shared,
      period: "30d",
    }),
    "90d": buildModel({
      ...shared,
      period: "90d",
    }),
  };
}
