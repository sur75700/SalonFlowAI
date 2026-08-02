import type {
  AppLocale,
} from "../../lib/i18n/types";

import type {
  AnalyticsPeriodKey,
  AnalyticsPreviewModel,
} from "./analytics-v2-types";

import type {
  RealAnalyticsPeriodModels,
} from "./analytics-v2-real-calculations";

import {
  analyticsV2T,
  type AnalyticsV2Key,
  type AnalyticsV2Params,
} from "./analytics-v2-i18n";

const PERIOD_DAYS: Record<
  AnalyticsPeriodKey,
  number
> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function numberFromText(
  value: string | number | null | undefined
): number {
  const match = String(value ?? "")
    .replaceAll(",", "")
    .match(/-?\d+(?:\.\d+)?/);

  return match
    ? Number(match[0])
    : 0;
}

function valueAfterColon(
  value: string
): string {
  const separator = value.indexOf(":");

  return separator >= 0
    ? value.slice(separator + 1).trim()
    : value;
}

function localizedLastUpdated(
  value: string,
  locale: AppLocale
): string {
  const tr = (
    key: AnalyticsV2Key,
    params?: AnalyticsV2Params
  ) =>
    analyticsV2T(
      locale,
      key,
      params
    );

  const match = value.match(
    /^Updated (.+?) · (.+)$/
  );

  if (!match) {
    return value;
  }

  const [, time, rawDetails] = match;

  const details = rawDetails
    .split(" · ")
    .map((part) => {
      const currencyMatch = part.match(
        /^(\d+) other-currency records excluded$/
      );

      if (currencyMatch) {
        return tr(
          "hero.excludedCurrency",
          {
            count: currencyMatch[1],
          }
        );
      }

      const invalidDateMatch = part.match(
        /^(\d+) invalid-date records excluded$/
      );

      if (invalidDateMatch) {
        return tr(
          "hero.invalidDate",
          {
            count: invalidDateMatch[1],
          }
        );
      }

      const appointmentMatch = part.match(
        /^(\d+) appointments$/
      );

      if (appointmentMatch) {
        return tr(
          "hero.appointments",
          {
            count: appointmentMatch[1],
          }
        );
      }

      return part;
    })
    .join(" · ");

  return tr(
    "hero.updated",
    {
      time,
      details,
    }
  );
}

function cloneModel(
  model: AnalyticsPreviewModel
): AnalyticsPreviewModel {
  return {
    ...model,

    kpis: model.kpis.map((item) => ({
      ...item,
      trend: [...item.trend],
    })),

    revenueSeries:
      model.revenueSeries.map(
        (item) => ({
          ...item,
        })
      ),

    services:
      model.services.map(
        (item) => ({
          ...item,
        })
      ),

    statuses:
      model.statuses.map(
        (item) => ({
          ...item,
        })
      ),

    clientSignals:
      model.clientSignals.map(
        (item) => ({
          ...item,
        })
      ),

    actions:
      model.actions.map(
        (item) => ({
          ...item,
        })
      ),

    opportunities:
      model.opportunities.map(
        (item) => ({
          ...item,
        })
      ),

    heatmap:
      model.heatmap.map(
        (row) => [...row]
      ),
  };
}

function localizeModel(
  source: AnalyticsPreviewModel,
  locale: AppLocale,
  period: AnalyticsPeriodKey
): AnalyticsPreviewModel {
  const model = cloneModel(source);
  const days = PERIOD_DAYS[period];

  const tr = (
    key: AnalyticsV2Key,
    params?: AnalyticsV2Params
  ) =>
    analyticsV2T(
      locale,
      key,
      params
    );

  const findKpi = (id: string) =>
    model.kpis.find(
      (item) => item.id === id
    );

  const findStatus = (id: string) =>
    model.statuses.find(
      (item) => item.id === id
    );

  const findClientSignal = (
    id: string
  ) =>
    model.clientSignals.find(
      (item) => item.id === id
    );

  const revenueKpi =
    findKpi("revenue");

  const bookingsKpi =
    findKpi("bookings");

  const clientsKpi =
    findKpi("clients");

  const ticketKpi =
    findKpi("ticket");

  const cancellationKpi =
    findKpi("cancellation");

  const growthKpi =
    findKpi("growth");

  const retentionSignal =
    findClientSignal("retention");

  const newClientSignal =
    findClientSignal("new");

  const atRiskSignal =
    findClientSignal("at-risk");

  const highValueSignal =
    findClientSignal("high-value");

  const completedStatus =
    findStatus("completed");

  const scheduledStatus =
    findStatus("scheduled");

  const cancelledStatus =
    findStatus("cancelled");

  const otherStatus =
    findStatus("other");

  const totalBookings =
    numberFromText(
      bookingsKpi?.value
    );

  const atRiskCount =
    numberFromText(
      atRiskSignal?.value
    );

  const cancelledCount =
    cancelledStatus?.value ?? 0;

  const cancellationRate =
    numberFromText(
      cancellationKpi?.value
    );

  const topService =
    model.services[0] ?? null;

  model.overline = tr(
    "hero.overline"
  );

  model.title = tr(
    "hero.title"
  );

  model.subtitle = tr(
    "hero.subtitle"
  );

  model.previewLabel = tr(
    "hero.liveWindow",
    {
      period:
        period.toUpperCase(),
    }
  );

  model.lastUpdated =
    localizedLastUpdated(
      source.lastUpdated,
      locale
    );

  if (revenueKpi) {
    revenueKpi.label = tr(
      "kpi.completedRevenue"
    );

    revenueKpi.context = tr(
      "kpi.vsPreviousDays",
      { days }
    );
  }

  if (bookingsKpi) {
    bookingsKpi.label = tr(
      "kpi.bookings"
    );

    bookingsKpi.context = tr(
      "kpi.vsPreviousDays",
      { days }
    );
  }

  if (clientsKpi) {
    clientsKpi.label = tr(
      "kpi.returningClients"
    );

    const match =
      source.kpis
        .find(
          (item) =>
            item.id === "clients"
        )
        ?.context.match(
          /(\d+)\s+returning of\s+(\d+)\s+active/
        );

    clientsKpi.context = tr(
      "kpi.returningOfActive",
      {
        returning:
          match?.[1] ?? 0,
        active:
          match?.[2] ?? 0,
      }
    );
  }

  if (ticketKpi) {
    ticketKpi.label = tr(
      "kpi.averageTicket"
    );

    const count =
      numberFromText(
        source.kpis.find(
          (item) =>
            item.id === "ticket"
        )?.context
      );

    ticketKpi.context = tr(
      "kpi.completedAppointments",
      { count }
    );
  }

  if (cancellationKpi) {
    cancellationKpi.label = tr(
      "kpi.cancellationRate"
    );

    cancellationKpi.context = tr(
      "kpi.cancelledAppointments",
      {
        count: cancelledCount,
      }
    );
  }

  if (growthKpi) {
    growthKpi.label = tr(
      "kpi.businessGrowth"
    );

    growthKpi.context = tr(
      "kpi.realRevenueComparison"
    );

    growthKpi.delta =
      model.aiScore >= 85
        ? tr(
            "health.excellent"
          )
        : model.aiScore >= 70
          ? tr(
              "health.healthy"
            )
          : tr(
              "health.review"
            );

    if (
      growthKpi.value === "New"
    ) {
      growthKpi.value = tr(
        "common.new"
      );
    }
  }

  model.kpis.forEach((item) => {
    if (item.delta === "New") {
      item.delta = tr(
        "common.new"
      );
    }
  });

  if (completedStatus) {
    completedStatus.label = tr(
      "status.completed"
    );
  }

  if (scheduledStatus) {
    scheduledStatus.label = tr(
      "status.scheduled"
    );
  }

  if (cancelledStatus) {
    cancelledStatus.label = tr(
      "status.cancelled"
    );
  }

  if (otherStatus) {
    otherStatus.label = tr(
      "status.other"
    );
  }

  if (retentionSignal) {
    retentionSignal.label = tr(
      "client.retention"
    );

    const returningCount =
      numberFromText(
        source.clientSignals.find(
          (item) =>
            item.id === "retention"
        )?.hint
      );

    retentionSignal.hint = tr(
      "client.retentionHint",
      {
        count: returningCount,
      }
    );
  }

  if (newClientSignal) {
    newClientSignal.label = tr(
      "client.newClients"
    );

    newClientSignal.hint = tr(
      "client.newHint"
    );
  }

  if (atRiskSignal) {
    atRiskSignal.label = tr(
      "client.atRiskClients"
    );

    atRiskSignal.hint = tr(
      "client.atRiskHint"
    );
  }

  if (highValueSignal) {
    highValueSignal.label = tr(
      "client.highValueClients"
    );

    highValueSignal.hint = tr(
      "client.highValueHint"
    );
  }

  const recoveryAction =
    model.actions.find(
      (item) => item.id === "a1"
    );

  if (recoveryAction) {
    recoveryAction.title = tr(
      "action.recoverTitle"
    );

    recoveryAction.description =
      atRiskCount > 0
        ? tr(
            "action.recoverWithCount",
            {
              count:
                atRiskCount,
            }
          )
        : tr(
            "action.recoverNone"
          );

    recoveryAction.impact = tr(
      "action.potentialRecovery",
      {
        value: valueAfterColon(
          source.actions.find(
            (item) =>
              item.id === "a1"
          )?.impact ?? ""
        ),
      }
    );

    recoveryAction.actionLabel = tr(
      "action.reviewClients"
    );
  }

  const scaleAction =
    model.actions.find(
      (item) => item.id === "a2"
    );

  if (scaleAction) {
    scaleAction.title = tr(
      "action.scaleTitle"
    );

    scaleAction.description =
      topService
        ? tr(
            "action.scaleWithService",
            {
              service:
                topService.name,
              count:
                topService.bookings,
            }
          )
        : tr(
            "action.scaleNone"
          );

    scaleAction.impact = tr(
      "action.growthOpportunity",
      {
        value: valueAfterColon(
          source.actions.find(
            (item) =>
              item.id === "a2"
          )?.impact ?? ""
        ),
      }
    );

    scaleAction.actionLabel = tr(
      "action.reviewService"
    );
  }

  const cancellationAction =
    model.actions.find(
      (item) => item.id === "a3"
    );

  if (cancellationAction) {
    const originalDescription =
      source.actions.find(
        (item) =>
          item.id === "a3"
      )?.description ?? "";

    const valueMatch =
      originalDescription.match(
        /represent (.+) in appointment value\./
      );

    cancellationAction.title = tr(
      "action.cancelTitle"
    );

    cancellationAction.description =
      cancelledCount > 0
        ? tr(
            "action.cancelWithCount",
            {
              count:
                cancelledCount,
              value:
                valueMatch?.[1] ??
                "—",
            }
          )
        : tr(
            "action.cancelNone"
          );

    cancellationAction.impact = tr(
      "action.protectedValue",
      {
        value: valueAfterColon(
          source.actions.find(
            (item) =>
              item.id === "a3"
          )?.impact ?? ""
        ),
      }
    );

    cancellationAction.actionLabel = tr(
      "action.openPlaybook"
    );
  }

  const opportunityOne =
    model.opportunities.find(
      (item) => item.id === "o1"
    );

  if (opportunityOne) {
    opportunityOne.title = tr(
      "opportunity.reactivateClients"
    );
  }

  const opportunityTwo =
    model.opportunities.find(
      (item) => item.id === "o2"
    );

  if (opportunityTwo) {
    opportunityTwo.title =
      topService
        ? tr(
            "opportunity.scaleService",
            {
              service:
                topService.name,
            }
          )
        : tr(
            "opportunity.scaleTopService"
          );
  }

  const opportunityThree =
    model.opportunities.find(
      (item) => item.id === "o3"
    );

  if (opportunityThree) {
    opportunityThree.title = tr(
      "opportunity.reduceCancellations"
    );
  }

  const opportunityFour =
    model.opportunities.find(
      (item) => item.id === "o4"
    );

  if (opportunityFour) {
    opportunityFour.title = tr(
      "opportunity.raiseAverageTicket"
    );
  }

  model.aiStatus =
    model.aiScore >= 85
      ? tr(
          "health.excellent"
        )
      : model.aiScore >= 70
        ? tr(
            "health.healthy"
          )
        : model.aiScore >= 50
          ? tr(
              "health.needsAttention"
            )
          : tr(
              "health.highPriority"
            );

  const originalSignal =
    source.primarySignal;

  if (
    originalSignal.startsWith(
      "No appointment activity"
    ) ||
    totalBookings === 0
  ) {
    model.primarySignal = tr(
      "signal.noActivity"
    );

    model.nextAction = tr(
      "signal.noActivityAction"
    );
  } else if (
    originalSignal.startsWith(
      "Cancellation exposure"
    )
  ) {
    model.primarySignal = tr(
      "signal.cancellationExposure",
      {
        rate:
          cancellationRate.toFixed(1),
      }
    );

    model.nextAction = tr(
      "signal.cancellationAction"
    );
  } else if (
    originalSignal.includes(
      "previously active clients"
    )
  ) {
    model.primarySignal = tr(
      "signal.atRisk",
      {
        count: atRiskCount,
      }
    );

    model.nextAction = tr(
      "signal.atRiskAction"
    );
  } else if (
    originalSignal.includes(
      "strongest selected-period service signal"
    ) &&
    topService
  ) {
    model.primarySignal = tr(
      "signal.strongestService",
      {
        service:
          topService.name,
      }
    );

    model.nextAction = tr(
      "signal.strongestServiceAction",
      {
        service:
          topService.name,
      }
    );
  } else {
    model.primarySignal = tr(
      "signal.stable"
    );

    model.nextAction = tr(
      "signal.stableAction"
    );
  }

  model.expectedImpact = tr(
    "expected.calculatedOpportunity",
    {
      value: valueAfterColon(
        source.expectedImpact
      ),
    }
  );

  return model;
}

export function localizeRealAnalyticsPeriodModels(
  models: RealAnalyticsPeriodModels,
  locale: AppLocale
): RealAnalyticsPeriodModels {
  return {
    "7d": localizeModel(
      models["7d"],
      locale,
      "7d"
    ),

    "30d": localizeModel(
      models["30d"],
      locale,
      "30d"
    ),

    "90d": localizeModel(
      models["90d"],
      locale,
      "90d"
    ),
  };
}
