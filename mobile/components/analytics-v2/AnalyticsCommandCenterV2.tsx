import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Polyline,
} from "react-native-svg";

import RoyalCosmosBackground from "../ui/RoyalCosmosBackground";
import AnalyticsExportSheetV2 from "./AnalyticsExportSheetV2";
import AnalyticsLiveInsightSheetV2 from "./AnalyticsLiveInsightSheetV2";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import {
  analyticsV2SurfaceT,
  analyticsV2UiT,
  type AnalyticsV2UiKey,
} from "./analytics-v2-i18n";
import {
  getAnalyticsPreviewModelForPeriod,
} from "./analytics-v2-period-models";
import AnalyticsInsightSheetV2, {
  type AnalyticsInsightSheetKey,
} from "./AnalyticsInsightSheetV2";

import type {
  AnalyticsActionPreview,
  AnalyticsKpiPreview,
  AnalyticsPeriodKey,
  AnalyticsPreviewModel,
  AnalyticsServicePreview,
  AnalyticsStatusPreview,
  AnalyticsTabKey,
  AnalyticsTone,
} from "./analytics-v2-types";

type Props = {
  model: AnalyticsPreviewModel;
  periodModels?: Partial<
    Record<
      AnalyticsPeriodKey,
      AnalyticsPreviewModel
    >
  >;
  dataMode?: "preview" | "live";
  refreshing?: boolean;
  onRefresh?: () => void;
};

const COLORS = {
  canvas: "#050711",
  surface: "#0D1324",
  surfaceRaised: "#111A2F",
  surfaceStrong: "#151F38",
  text: "#F7F8FF",
  textSecondary: "#AAB3CA",
  textMuted: "#75809A",
  border: "rgba(255,255,255,0.09)",
  violet: "#8C7CFF",
  emerald: "#39F5A6",
  cyan: "#58D8FF",
  gold: "#FFD36A",
  rose: "#FF6B8A",
  green: "#74FF9C",
} as const;

const TONE_MAP: Record<
  AnalyticsTone,
  {
    accent: string;
    soft: string;
    surface: string;
    border: string;
  }
> = {
  violet: {
    accent: COLORS.violet,
    soft: "rgba(140,124,255,0.15)",
    surface: "#17173B",
    border: "rgba(140,124,255,0.32)",
  },
  emerald: {
    accent: COLORS.emerald,
    soft: "rgba(57,245,166,0.13)",
    surface: "#102D29",
    border: "rgba(57,245,166,0.29)",
  },
  cyan: {
    accent: COLORS.cyan,
    soft: "rgba(88,216,255,0.13)",
    surface: "#102A38",
    border: "rgba(88,216,255,0.28)",
  },
  gold: {
    accent: COLORS.gold,
    soft: "rgba(255,211,106,0.14)",
    surface: "#32291A",
    border: "rgba(255,211,106,0.28)",
  },
  rose: {
    accent: COLORS.rose,
    soft: "rgba(255,107,138,0.14)",
    surface: "#351A2A",
    border: "rgba(255,107,138,0.29)",
  },
  green: {
    accent: COLORS.green,
    soft: "rgba(116,255,156,0.13)",
    surface: "#153020",
    border: "rgba(116,255,156,0.28)",
  },
};

const TAB_OPTIONS: {
  key: AnalyticsTabKey;
  labelKey: AnalyticsV2UiKey;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    key: "overview",
    labelKey: "tab.overview",
    icon: "grid-outline",
  },
  {
    key: "revenue",
    labelKey: "tab.revenue",
    icon: "cash-outline",
  },
  {
    key: "clients",
    labelKey: "tab.clients",
    icon: "people-outline",
  },
  {
    key: "services",
    labelKey: "tab.services",
    icon: "diamond-outline",
  },
  {
    key: "operations",
    labelKey: "tab.operations",
    icon: "pulse-outline",
  },
  {
    key: "ai",
    labelKey: "tab.aiActions",
    icon: "sparkles-outline",
  },
];

const PERIOD_OPTIONS: {
  key: AnalyticsPeriodKey;
  labelKey: AnalyticsV2UiKey;
}[] = [
  { key: "7d", labelKey: "period.7d" },
  { key: "30d", labelKey: "period.30d" },
  { key: "90d", labelKey: "period.90d" },
];

function useAnalyticsSurfaceT() {
  const { locale } = useAppPreferences();

  return (source: string) =>
    analyticsV2SurfaceT(locale, source);
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionHeader({
  overline,
  title,
  subtitle,
  action,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        {overline ? (
          <Text style={styles.sectionOverline}>{overline}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {action}
    </View>
  );
}

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const points = useMemo(() => {
    if (!values.length) return "";

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x =
          values.length === 1
            ? 50
            : (index / (values.length - 1)) * 100;

        const y = 38 - ((value - min) / range) * 28;

        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  return (
    <Svg width="100%" height={42} viewBox="0 0 100 42">
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.14}
      />

      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function KpiCard({
  kpi,
  flexBasis,
}: {
  kpi: AnalyticsKpiPreview;
  flexBasis: `${number}%`;
}) {
  const tone = TONE_MAP[kpi.tone];

  return (
    <View
      style={[
        styles.kpiCard,
        {
          flexBasis,
          backgroundColor: tone.surface,
          borderColor: tone.border,
        },
      ]}
    >
      <View style={styles.kpiTop}>
        <View
          style={[
            styles.kpiIcon,
            { backgroundColor: tone.soft },
          ]}
        >
          <Ionicons
            name={kpi.icon}
            size={20}
            color={tone.accent}
          />
        </View>

        <View
          style={[
            styles.deltaPill,
            { backgroundColor: tone.soft },
          ]}
        >
          <Ionicons
            name={
              kpi.direction === "down"
                ? "trending-down-outline"
                : kpi.direction === "flat"
                  ? "remove-outline"
                  : "trending-up-outline"
            }
            size={13}
            color={tone.accent}
          />

          <Text
            style={[
              styles.deltaText,
              { color: tone.accent },
            ]}
          >
            {kpi.delta}
          </Text>
        </View>
      </View>

      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text style={styles.kpiValue}>{kpi.value}</Text>
      <Text style={styles.kpiContext}>{kpi.context}</Text>

      <View style={styles.kpiSparkline}>
        <Sparkline
          values={kpi.trend}
          color={tone.accent}
        />
      </View>
    </View>
  );
}

function RevenuePulse({
  model,
  dataMode,
}: {
  model: AnalyticsPreviewModel;
  dataMode: "preview" | "live";
}) {
  const chart = useMemo(() => {
    const values = model.revenueSeries.flatMap((point) => [
      point.current,
      point.previous,
    ]);

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const createPoints = (
      key: "current" | "previous"
    ) =>
      model.revenueSeries
        .map((point, index) => {
          const x =
            40 +
            (index /
              Math.max(model.revenueSeries.length - 1, 1)) *
              820;

          const y =
            220 - ((point[key] - min) / range) * 170;

          return `${x},${y}`;
        })
        .join(" ");

    return {
      current: createPoints("current"),
      previous: createPoints("previous"),
    };
  }, [model.revenueSeries]);

  const st = useAnalyticsSurfaceT();

  return (
    <Card style={styles.revenueCard}>
      <SectionHeader
        overline={st("REVENUE INTELLIGENCE")}
        title={st("Revenue Pulse")}
        subtitle={
          dataMode === "live"
            ? st("Completed revenue compared with the previous selected period.")
            : st("Completed revenue compared with the previous preview period.")
        }
        action={
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {dataMode === "live"
                ? st("Live data")
                : st("Live preview")}
            </Text>
          </View>
        }
      />

      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendLine,
              { backgroundColor: COLORS.emerald },
            ]}
          />
          <Text style={styles.legendText}>{st("Current period")}</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendLine,
              {
                backgroundColor:
                  "rgba(170,179,202,0.55)",
              },
            ]}
          />
          <Text style={styles.legendText}>
              {st("Previous period")}
            </Text>
        </View>
      </View>

      <View style={styles.revenueChart}>
        <Svg width="100%" height={250} viewBox="0 0 900 250">
          {[50, 92, 134, 176, 218].map((y) => (
            <Line
              key={y}
              x1={40}
              y1={y}
              x2={860}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}

          <Polygon
            points={`${chart.current} 860,220 40,220`}
            fill="rgba(57,245,166,0.09)"
          />

          <Polyline
            points={chart.previous}
            fill="none"
            stroke="rgba(170,179,202,0.54)"
            strokeWidth={2}
            strokeDasharray="8 8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Polyline
            points={chart.current}
            fill="none"
            stroke={COLORS.emerald}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.1}
          />

          <Polyline
            points={chart.current}
            fill="none"
            stroke={COLORS.emerald}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={styles.chartAxis}>
        {model.revenueSeries.map((point, index) => (
          <Text
            key={`${point.label}-${index}`}
            style={styles.axisLabel}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </Card>
  );
}

function ExecutiveBrief({
  model,
  onOpenDetails,
}: {
  model: AnalyticsPreviewModel;
  onOpenDetails: () => void;
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <Card style={styles.briefCard}>
      <SectionHeader
        overline={st("AI EXECUTIVE BRIEF")}
        title={st("Business Health")}
        subtitle={st("A focused summary of the strongest business signal.")}
      />

      <View style={styles.scoreRow}>
        <View style={styles.scoreDial}>
          <View style={styles.scoreDialInner}>
            <Text style={styles.scoreValue}>
              {model.aiScore}
            </Text>
            <Text style={styles.scoreCaption}>{st("of 100")}</Text>
          </View>
        </View>

        <View style={styles.scoreCopy}>
          <View style={styles.healthyPill}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={COLORS.emerald}
            />
            <Text style={styles.healthyText}>
              {model.aiStatus}
            </Text>
          </View>

          <Text style={styles.scoreHeadline}>
              {st("Strong momentum with a clear next move.")}
            </Text>
        </View>
      </View>

      <View style={styles.briefSignal}>
        <Text style={styles.briefSignalLabel}>
            {st("PRIMARY SIGNAL")}
          </Text>
        <Text style={styles.briefSignalText}>
          {model.primarySignal}
        </Text>
      </View>

      <View style={styles.nextActionBox}>
        <View style={styles.nextActionIcon}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={COLORS.violet}
          />
        </View>

        <View style={styles.nextActionCopy}>
          <Text style={styles.nextActionLabel}>
              {st("BEST NEXT ACTION")}
            </Text>
          <Text style={styles.nextActionText}>
            {model.nextAction}
          </Text>
          <Text style={styles.nextActionImpact}>
            {model.expectedImpact}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={st("Open intelligence details")}
        onPress={onOpenDetails}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
            {st("Open intelligence details")}
          </Text>
        <Ionicons
          name="arrow-forward"
          size={17}
          color="#FFFFFF"
        />
      </Pressable>
    </Card>
  );
}

function StatusRing({
  statuses,
}: {
  statuses: AnalyticsStatusPreview[];
}) {
  const total = statuses.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const st = useAnalyticsSurfaceT();

  return (
    <View style={styles.statusContent}>
      <View style={styles.statusRingWrap}>
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Circle
            cx={75}
            cy={75}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={13}
          />

          <G transform="rotate(-90 75 75)">
            {statuses.map((status) => {
              const length =
                total > 0
                  ? (status.value / total) * circumference
                  : 0;

              const currentOffset = offset;
              offset += length;

              return (
                <Circle
                  key={status.id}
                  cx={75}
                  cy={75}
                  r={radius}
                  fill="none"
                  stroke={TONE_MAP[status.tone].accent}
                  strokeWidth={13}
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(length - 4, 0)} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                />
              );
            })}
          </G>
        </Svg>

        <View style={styles.statusRingCenter}>
          <Text style={styles.statusTotal}>{total}</Text>
          <Text style={styles.statusTotalLabel}>
              {st("BOOKINGS")}
            </Text>
        </View>
      </View>

      <View style={styles.statusLegend}>
        {statuses.map((status) => {
          const tone = TONE_MAP[status.tone];
          const percent =
            total > 0
              ? Math.round((status.value / total) * 100)
              : 0;

          return (
            <View
              key={status.id}
              style={styles.statusLegendRow}
            >
              <View style={styles.statusLegendLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: tone.accent },
                  ]}
                />
                <Text style={styles.statusLabel}>
                  {status.label}
                </Text>
              </View>

              <Text style={styles.statusValue}>
                {status.value}
                <Text style={styles.statusPercent}>
                  {" "}
                  · {percent}%
                </Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ServiceRanking({
  services,
}: {
  services: AnalyticsServicePreview[];
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <View style={styles.rankingList}>
      {services.map((service, index) => {
        const tone = TONE_MAP[service.tone];

        return (
          <View
            key={service.id}
            style={styles.rankingRow}
          >
            <View style={styles.rankingNumber}>
              <Text style={styles.rankingNumberText}>
                {index + 1}
              </Text>
            </View>

            <View style={styles.rankingMain}>
              <View style={styles.rankingTitleRow}>
                <Text
                  style={styles.rankingName}
                  numberOfLines={1}
                >
                  {service.name}
                </Text>

                <Text
                  style={[
                    styles.rankingRevenue,
                    { color: tone.accent },
                  ]}
                >
                  {service.revenue}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${service.share}%`,
                      backgroundColor: tone.accent,
                    },
                  ]}
                />
              </View>

              <Text style={styles.rankingHint}>
                {service.bookings} {st("bookings")} ·{" "}
                {service.share}% {st("relative demand")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ClientSignals({
  model,
}: {
  model: AnalyticsPreviewModel;
}) {
  return (
    <View style={styles.clientGrid}>
      {model.clientSignals.map((signal) => {
        const tone = TONE_MAP[signal.tone];

        return (
          <View
            key={signal.id}
            style={[
              styles.clientSignal,
              {
                backgroundColor: tone.soft,
                borderColor: tone.border,
              },
            ]}
          >
            <Text
              style={[
                styles.clientSignalValue,
                { color: tone.accent },
              ]}
            >
              {signal.value}
            </Text>

            <Text style={styles.clientSignalLabel}>
              {signal.label}
            </Text>

            <Text style={styles.clientSignalHint}>
              {signal.hint}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Heatmap({
  rows,
}: {
  rows: number[][];
}) {
  const st = useAnalyticsSurfaceT();
  const days = [
      st("Mon"),
      st("Tue"),
      st("Wed"),
      st("Thu"),
      st("Fri"),
      st("Sat"),
      st("Sun"),
    ];

  const hours = ["09", "11", "13", "15", "17", "19"];

  return (
    <View>
      <View style={styles.heatmapHeader}>
        <View style={styles.heatmapDaySpacer} />
        {hours.map((hour) => (
          <Text key={hour} style={styles.heatmapHour}>
            {hour}
          </Text>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View
          key={days[rowIndex]}
          style={styles.heatmapRow}
        >
          <Text style={styles.heatmapDay}>
            {days[rowIndex]}
          </Text>

          {row.map((intensity, cellIndex) => (
            <View
              key={`${rowIndex}-${cellIndex}`}
              style={[
                styles.heatCell,
                {
                  backgroundColor:
                    intensity === 5
                      ? "rgba(140,124,255,0.90)"
                      : intensity === 4
                        ? "rgba(140,124,255,0.66)"
                        : intensity === 3
                          ? "rgba(88,216,255,0.42)"
                          : intensity === 2
                            ? "rgba(88,216,255,0.24)"
                            : "rgba(255,255,255,0.07)",
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function ActionCard({
  action,
  onOpen,
}: {
  action: AnalyticsActionPreview;
  onOpen: (action: AnalyticsActionPreview) => void;
}) {
  const tone = TONE_MAP[action.tone];

  const st = useAnalyticsSurfaceT();

  return (
    <View
      style={[
        styles.actionCard,
        {
          borderColor: tone.border,
          backgroundColor: tone.surface,
        },
      ]}
    >
      <View style={styles.actionHeader}>
        <View
          style={[
            styles.actionIcon,
            { backgroundColor: tone.soft },
          ]}
        >
          <Ionicons
            name={action.icon}
            size={20}
            color={tone.accent}
          />
        </View>

        <View style={styles.actionBadges}>
          <View
            style={[
              styles.actionBadge,
              { backgroundColor: tone.soft },
            ]}
          >
            <Text
              style={[
                styles.actionBadgeText,
                { color: tone.accent },
              ]}
            >
              {action.priority.toUpperCase()}
            </Text>
          </View>

          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {action.confidence}% {st("confidence")}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.actionTitle}>
        {action.title}
      </Text>

      <Text style={styles.actionDescription}>
        {action.description}
      </Text>

      <View style={styles.actionImpactBox}>
        <Text style={styles.actionImpactLabel}>
            {st("EXPECTED IMPACT")}
          </Text>
        <Text
          style={[
            styles.actionImpactValue,
            { color: tone.accent },
          ]}
        >
          {action.impact}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.actionLabel}
        onPress={() => onOpen(action)}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: tone.accent },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.actionButtonText}>
          {action.actionLabel}
        </Text>

        <Ionicons
          name="arrow-forward"
          size={16}
          color="#071016"
        />
      </Pressable>
    </View>
  );
}

function OpportunityMatrix({
  model,
}: {
  model: AnalyticsPreviewModel;
}) {
  return (
    <View style={styles.matrixGrid}>
      {model.opportunities.map((opportunity) => {
        const tone = TONE_MAP[opportunity.tone];

        return (
          <View
            key={opportunity.id}
            style={[
              styles.matrixCell,
              {
                backgroundColor: tone.soft,
                borderColor: tone.border,
              },
            ]}
          >
            <View style={styles.matrixMeta}>
              <Text
                style={[
                  styles.matrixMetaText,
                  { color: tone.accent },
                ]}
              >
                {opportunity.impact} impact
              </Text>

              <Text style={styles.matrixEffort}>
                {opportunity.effort} effort
              </Text>
            </View>

            <Text style={styles.matrixTitle}>
              {opportunity.title}
            </Text>

            <Text
              style={[
                styles.matrixValue,
                { color: tone.accent },
              ]}
            >
              {opportunity.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function OverviewTab({
  model,
  wide,
  dataMode,
  onOpenExecutive,
  onOpenAction,
}: {
  model: AnalyticsPreviewModel;
  wide: boolean;
  dataMode: "preview" | "live";
  onOpenExecutive: () => void;
  onOpenAction: (action: AnalyticsActionPreview) => void;
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <>
      <View
        style={[
          styles.primaryGrid,
          wide && styles.primaryGridWide,
        ]}
      >
        <View style={styles.primaryMain}>
          <RevenuePulse
            model={model}
            dataMode={dataMode}
          />
        </View>

        <View style={styles.primarySide}>
          <ExecutiveBrief
            model={model}
            onOpenDetails={onOpenExecutive}
          />
        </View>
      </View>

      <View
        style={[
          styles.secondaryGrid,
          wide && styles.secondaryGridWide,
        ]}
      >
        <Card style={styles.secondaryCard}>
          <SectionHeader
            overline={st("OPERATIONS")}
            title={st("Booking Status")}
            subtitle={st("A clean view of appointment flow.")}
          />
          <StatusRing statuses={model.statuses} />
        </Card>

        <Card style={styles.secondaryCard}>
          <SectionHeader
            overline={st("SERVICE INTELLIGENCE")}
            title={st("Top Services")}
            subtitle={st("Revenue and demand contribution.")}
          />
          <ServiceRanking services={model.services} />
        </Card>
      </View>

      <View
        style={[
          styles.secondaryGrid,
          wide && styles.secondaryGridWide,
        ]}
      >
        <Card style={styles.secondaryCard}>
          <SectionHeader
            overline={st("CLIENT INTELLIGENCE")}
            title={st("Client Health")}
            subtitle={st("Retention, acquisition and risk signals.")}
          />
          <ClientSignals model={model} />
        </Card>

        <Card style={styles.secondaryCard}>
          <SectionHeader
            overline={st("OPERATIONS INTELLIGENCE")}
            title={st("Demand Heatmap")}
            subtitle={st("Appointment intensity by weekday and hour.")}
          />
          <Heatmap rows={model.heatmap} />
        </Card>
      </View>

      <Card>
        <SectionHeader
          overline={st("AI MISSION CONTROL")}
          title={st("Recommended Actions")}
          subtitle={st("Prioritized decisions with evidence and potential impact.")}
        />

        <View style={styles.actionsGrid}>
          {model.actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onOpen={onOpenAction}
            />
          ))}
        </View>
      </Card>
    </>
  );
}

function RevenueTab({
  model,
  wide,
}: {
  model: AnalyticsPreviewModel;
  wide: boolean;
}) {
  return (
    <>
      <RevenuePulse
        model={model}
        dataMode="preview"
      />

      <View
        style={[
          styles.secondaryGrid,
          wide && styles.secondaryGridWide,
        ]}
      >
        <Card style={styles.secondaryCard}>
          <SectionHeader
            overline="REVENUE COMPOSITION"
            title="Revenue Layers"
            subtitle="Completed, scheduled, forecast and opportunity remain visually distinct."
          />

          <View style={styles.revenueLayers}>
            {[
              ["Completed", "AMD 2.38M", "emerald"],
              ["Scheduled", "AMD 824K", "violet"],
              ["Forecast", "AMD 3.12M", "cyan"],
              ["Opportunity", "AMD 648K", "gold"],
            ].map(([label, value, toneName]) => {
              const tone =
                TONE_MAP[toneName as AnalyticsTone];

              return (
                <View
                  key={label}
                  style={[
                    styles.revenueLayer,
                    {
                      backgroundColor: tone.soft,
                      borderColor: tone.border,
                    },
                  ]}
                >
                  <Text style={styles.revenueLayerLabel}>
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.revenueLayerValue,
                      { color: tone.accent },
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.secondaryCard}>
          <SectionHeader
            overline="SCENARIO LAB"
            title="Revenue Simulator"
            subtitle="Presentation-only controls for the future real simulator."
          />

          {[
            {
              label: "Bookings",
              value: "+12%",
              progress: 68,
            },
            {
              label: "Average ticket",
              value: "+5%",
              progress: 46,
            },
            {
              label: "Returning clients",
              value: "+8%",
              progress: 58,
            },
            {
              label: "Cancellations",
              value: "-3%",
              progress: 31,
            },
          ].map(({ label, value, progress }) => (
            <View key={String(label)} style={styles.simulatorRow}>
              <View style={styles.simulatorLabelRow}>
                <Text style={styles.simulatorLabel}>
                  {label}
                </Text>
                <Text style={styles.simulatorValue}>
                  {value}
                </Text>
              </View>

              <View style={styles.simulatorTrack}>
                <View
                  style={[
                    styles.simulatorFill,
                    {
                      width:
                        `${progress}%` as `${number}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.simulatorThumb,
                    {
                      left:
                        `${progress}%` as `${number}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}

          <View style={styles.simulatorResult}>
            <Text style={styles.simulatorResultLabel}>
              SIMULATED ADDITIONAL REVENUE
            </Text>
            <Text style={styles.simulatorResultValue}>
              AMD 486K
            </Text>
            <Text style={styles.simulatorDisclaimer}>
              Preview only — no salon data is being changed.
            </Text>
          </View>
        </Card>
      </View>
    </>
  );
}

function ClientsTab({
  model,
  wide,
}: {
  model: AnalyticsPreviewModel;
  wide: boolean;
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <View
      style={[
        styles.secondaryGrid,
        wide && styles.secondaryGridWide,
      ]}
    >
      <Card style={styles.secondaryCard}>
        <SectionHeader
          overline={st("CLIENT INTELLIGENCE")}
          title={st("Client Health")}
          subtitle={st("Retention and relationship quality.")}
        />
        <ClientSignals model={model} />
      </Card>

      <Card style={styles.secondaryCard}>
        <SectionHeader
          overline="REACTIVATION"
          title="At-risk Pipeline"
          subtitle="Clients requiring attention."
        />

        {[
          ["Loyal client segment", "3 clients", "High value"],
          ["Regular client segment", "5 clients", "Medium value"],
          ["First-time segment", "4 clients", "Low history"],
        ].map(([label, count, hint], index) => (
          <View key={label} style={styles.pipelineRow}>
            <View style={styles.pipelineIndex}>
              <Text style={styles.pipelineIndexText}>
                {index + 1}
              </Text>
            </View>

            <View style={styles.pipelineCopy}>
              <Text style={styles.pipelineTitle}>
                {label}
              </Text>
              <Text style={styles.pipelineHint}>
                {hint}
              </Text>
            </View>

            <Text style={styles.pipelineCount}>{count}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function ServicesTab({
  model,
}: {
  model: AnalyticsPreviewModel;
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <Card>
      <SectionHeader
        overline={st("SERVICE INTELLIGENCE")}
        title={st("Performance Ranking")}
        subtitle={st("A professional view of revenue contribution and relative demand.")}
      />
      <ServiceRanking services={model.services} />
    </Card>
  );
}

function OperationsTab({
  model,
  wide,
}: {
  model: AnalyticsPreviewModel;
  wide: boolean;
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <View
      style={[
        styles.secondaryGrid,
        wide && styles.secondaryGridWide,
      ]}
    >
      <Card style={styles.secondaryCard}>
        <SectionHeader
          overline={st("STATUS FLOW")}
          title={st("Booking Status")}
          subtitle={st("Operational composition.")}
        />
        <StatusRing statuses={model.statuses} />
      </Card>

      <Card style={styles.secondaryCard}>
        <SectionHeader
          overline={st("CAPACITY SIGNAL")}
          title={st("Demand Heatmap")}
          subtitle={st("Appointment intensity across the working week.")}
        />
        <Heatmap rows={model.heatmap} />
      </Card>
    </View>
  );
}

function AiActionsTab({
  model,
  onOpenAction,
}: {
  model: AnalyticsPreviewModel;
  onOpenAction: (action: AnalyticsActionPreview) => void;
}) {
  const st = useAnalyticsSurfaceT();

  return (
    <>
      <View style={styles.actionsGrid}>
        {model.actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onOpen={onOpenAction}
          />
        ))}
      </View>

      <Card>
        <SectionHeader
          overline={st("OPPORTUNITY MATRIX")}
          title={st("Impact vs Effort")}
          subtitle={st("A strategic prioritization system for business opportunities.")}
        />
        <OpportunityMatrix model={model} />
      </Card>
    </>
  );
}

export default function AnalyticsCommandCenterV2({
  model,
  periodModels,
  dataMode = "preview",
  refreshing = false,
  onRefresh,
}: Props) {
  const { width } = useWindowDimensions();
  const { locale } = useAppPreferences();

  const tr = (key: AnalyticsV2UiKey) =>
    analyticsV2UiT(locale, key);

  const st = (source: string) =>
    analyticsV2SurfaceT(locale, source);

  const wide = width >= 1160;
  const tablet = width >= 760;

  const [activeTab, setActiveTab] =
    useState<AnalyticsTabKey>("overview");

  const [period, setPeriod] =
    useState<AnalyticsPeriodKey>("30d");

  const [refreshingPreview, setRefreshingPreview] =
    useState(false);

  const [refreshLabel, setRefreshLabel] =
    useState<string | null>(null);

  const [exportOpen, setExportOpen] =
    useState(false);

  const isRefreshing =
    dataMode === "live"
      ? refreshing
      : refreshingPreview;

  const handleRefresh = () => {
    if (isRefreshing) return;

    setRefreshLabel(null);

    if (onRefresh) {
      onRefresh();
      return;
    }

    setRefreshingPreview(true);

    globalThis.setTimeout(() => {
      setRefreshingPreview(false);
      setRefreshLabel(tr("shell.updatedJustNow"));
    }, 650);
  };

  const periodModel = useMemo(
    () =>
      periodModels?.[period] ??
      getAnalyticsPreviewModelForPeriod(
        model,
        period
      ),
    [model, period, periodModels]
  );

  const [activeInsight, setActiveInsight] =
    useState<AnalyticsInsightSheetKey | null>(null);

  const openActionInsight = (
    action: AnalyticsActionPreview
  ) => {
    const insightKey: AnalyticsInsightSheetKey =
      action.id === "a1"
        ? "clients"
        : action.id === "a2"
          ? "service"
          : "playbook";

    setActiveInsight(insightKey);
  };

  const displayLastUpdated =
    isRefreshing
      ? dataMode === "live"
        ? tr("shell.refreshingLive")
        : tr("shell.refreshingPreview")
      : refreshLabel ??
        periodModel.lastUpdated;

  const kpiFlexBasis: `${number}%` = wide
    ? "15.3%"
    : tablet
      ? "31.8%"
      : "48.2%";

  return (
    <RoyalCosmosBackground style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          wide && styles.contentWide,
        ]}
      >
        <View style={styles.hero}>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />

          <View
            style={[
              styles.heroLayout,
              wide && styles.heroLayoutWide,
            ]}
          >
            <View style={styles.heroCopy}>
              <View style={styles.heroOverlineRow}>
                <Text style={styles.heroOverline}>
                  {periodModel.overline}
                </Text>

                <View style={styles.previewBadge}>
                  <View style={styles.previewBadgeDot} />
                  <Text style={styles.previewBadgeText}>
                    {periodModel.previewLabel}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>
                {periodModel.title}
              </Text>

              <Text style={styles.heroSubtitle}>
                {periodModel.subtitle}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaItem}>
                  <Ionicons
                    name="sync-outline"
                    size={15}
                    color={COLORS.emerald}
                  />
                  <Text style={styles.heroMetaText}>
                    {displayLastUpdated}
                  </Text>
                </View>

                <View style={styles.heroMetaItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={15}
                    color={COLORS.cyan}
                  />
                  <Text style={styles.heroMetaText}>
                    {tr("shell.explainableIntelligence")}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.heroControls}>
              <View style={styles.periodControl}>
                {PERIOD_OPTIONS.map((option) => {
                  const active = option.key === period;

                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => setPeriod(option.key)}
                      style={[
                        styles.periodButton,
                        active && styles.periodButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodButtonText,
                          active &&
                            styles.periodButtonTextActive,
                        ]}
                      >
                        {tr(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  dataMode === "live"
                    ? tr("shell.refreshLiveA11y")
                    : tr("shell.refreshPreviewA11y")
                }
                disabled={isRefreshing}
                onPress={handleRefresh}
                style={({ pressed }) => [
                  styles.heroAction,
                  isRefreshing &&
                    styles.heroActionDisabled,
                  pressed &&
                    !isRefreshing &&
                    styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name={
                    isRefreshing
                      ? "sync-outline"
                      : "refresh-outline"
                  }
                  size={18}
                  color={
                    isRefreshing
                      ? COLORS.cyan
                      : COLORS.text
                  }
                />
                <Text style={styles.heroActionText}>
                  {isRefreshing
                    ? dataMode === "live"
                      ? tr("shell.refreshingLive")
                      : tr("shell.refreshingPreview")
                    : tr("shell.refresh")}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr("shell.exportA11y")}
                onPress={() => setExportOpen(true)}
                style={({ pressed }) => [
                  styles.heroAction,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="download-outline"
                  size={18}
                  color={COLORS.gold}
                />
                <Text style={styles.heroActionText}>
                  {tr("shell.export")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {periodModel.kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              kpi={kpi}
              flexBasis={kpiFlexBasis}
            />
          ))}
        </View>

        <View style={styles.tabsShell}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TAB_OPTIONS.map((tab) => {
              const active = tab.key === activeTab;

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabButton,
                    active && styles.tabButtonActive,
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={17}
                    color={
                      active
                        ? COLORS.text
                        : COLORS.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.tabText,
                      active && styles.tabTextActive,
                    ]}
                  >
                    {tr(tab.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.tabBody}>
          {activeTab === "overview" ? (
            <OverviewTab
              model={periodModel}
              wide={wide}
              dataMode={dataMode}
              onOpenExecutive={() =>
                setActiveInsight("executive")
              }
              onOpenAction={openActionInsight}
            />
          ) : null}

          {activeTab === "revenue" ? (
            dataMode === "live" ? (
              <RevenuePulse
                model={periodModel}
                dataMode="live"
              />
            ) : (
              <RevenueTab
                model={periodModel}
                wide={wide}
              />
            )
          ) : null}

          {activeTab === "clients" ? (
            dataMode === "live" ? (
              <View
                style={[
                  styles.secondaryGrid,
                  wide && styles.secondaryGridWide,
                ]}
              >
                <Card style={styles.secondaryCard}>
                  <SectionHeader
                    overline={st("CLIENT INTELLIGENCE")}
                    title={st("Client Health")}
                    subtitle={st("Retention and relationship quality.")}
                  />
                  <ClientSignals model={periodModel} />
                </Card>
              </View>
            ) : (
              <ClientsTab
                model={periodModel}
                wide={wide}
              />
            )
          ) : null}

          {activeTab === "services" ? (
            <ServicesTab model={periodModel} />
          ) : null}

          {activeTab === "operations" ? (
            <OperationsTab model={periodModel} wide={wide} />
          ) : null}

          {activeTab === "ai" ? (
            <AiActionsTab
              model={periodModel}
              onOpenAction={openActionInsight}
            />
          ) : null}
        </View>

        {dataMode === "preview" ? (
          <View style={styles.previewFooter}>
            <Ionicons
              name="construct-outline"
              size={17}
              color={COLORS.gold}
            />

            <Text style={styles.previewFooterText}>
              {tr("shell.previewFooter")}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {dataMode === "live" ? (
        <AnalyticsLiveInsightSheetV2
          visible={activeInsight !== null}
          insightKey={activeInsight}
          model={periodModel}
          onClose={() =>
            setActiveInsight(null)
          }
        />
      ) : (
        <AnalyticsInsightSheetV2
          visible={activeInsight !== null}
          insightKey={activeInsight}
          onClose={() =>
            setActiveInsight(null)
          }
        />
      )}
      <AnalyticsExportSheetV2
        visible={exportOpen}
        model={periodModel}
        periodLabel={period.toUpperCase()}
        dataMode={dataMode}
        onClose={() => setExportOpen(false)}
      />

    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  content: {
    width: "100%",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 80,
    gap: 18,
  },
  contentWide: {
    maxWidth: 1560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 22,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(140,124,255,0.29)",
    backgroundColor: "rgba(12,17,35,0.96)",
    padding: 24,
    minHeight: 230,
  },
  heroOrbPrimary: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 280,
    right: -60,
    top: -120,
    backgroundColor: "rgba(140,124,255,0.19)",
  },
  heroOrbSecondary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    left: "42%",
    bottom: -170,
    backgroundColor: "rgba(57,245,166,0.08)",
  },
  heroLayout: {
    flex: 1,
    gap: 24,
  },
  heroLayoutWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    maxWidth: 810,
  },
  heroOverlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  heroOverline: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(88,216,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(88,216,255,0.20)",
  },
  previewBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: COLORS.cyan,
  },
  previewBadgeText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 720,
    marginTop: 12,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 20,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroMetaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  heroControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  periodControl: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodButton: {
    minWidth: 50,
    paddingHorizontal: 13,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: COLORS.violet,
  },
  periodButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  heroAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroActionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  heroActionDisabled: {
    opacity: 0.62,
  },
  disabledExport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  disabledExportText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCard: {
    flexGrow: 1,
    minWidth: 160,
    minHeight: 190,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  kpiTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: "900",
  },
  kpiLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 16,
  },
  kpiValue: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  kpiContext: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  kpiSparkline: {
    height: 42,
    marginTop: 9,
  },

  tabsShell: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(13,19,36,0.97)",
    padding: 5,
  },
  tabsContent: {
    gap: 5,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 13,
  },
  tabButtonActive: {
    backgroundColor: "rgba(140,124,255,0.24)",
    borderWidth: 1,
    borderColor: "rgba(140,124,255,0.30)",
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  tabTextActive: {
    color: COLORS.text,
  },

  tabBody: {
    gap: 18,
  },
  primaryGrid: {
    gap: 18,
  },
  primaryGridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  primaryMain: {
    flex: 1.72,
  },
  primarySide: {
    flex: 1,
  },
  secondaryGrid: {
    gap: 18,
  },
  secondaryGridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  secondaryCard: {
    flex: 1,
  },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(13,19,36,0.97)",
    padding: 20,
    overflow: "hidden",
  },
  revenueCard: {
    minHeight: 420,
  },
  briefCard: {
    minHeight: 420,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionOverline: {
    color: COLORS.violet,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 7,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(57,245,166,0.10)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: COLORS.emerald,
  },
  liveText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: "800",
  },

  chartLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  legendLine: {
    width: 18,
    height: 3,
    borderRadius: 3,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  revenueChart: {
    width: "100%",
    overflow: "hidden",
    minHeight: 250,
  },
  chartAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  axisLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  scoreDial: {
    width: 112,
    height: 112,
    borderRadius: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 8,
    borderColor: COLORS.violet,
    backgroundColor: "rgba(140,124,255,0.09)",
  },
  scoreDialInner: {
    width: 84,
    height: 84,
    borderRadius: 84,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceStrong,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 31,
    fontWeight: "900",
  },
  scoreCaption: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },
  scoreCopy: {
    flex: 1,
  },
  healthyPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(57,245,166,0.10)",
  },
  healthyText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: "900",
  },
  scoreHeadline: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    marginTop: 12,
  },
  briefSignal: {
    marginTop: 20,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  briefSignalLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  briefSignalText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  nextActionBox: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(140,124,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(140,124,255,0.22)",
  },
  nextActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(140,124,255,0.15)",
  },
  nextActionCopy: {
    flex: 1,
  },
  nextActionLabel: {
    color: COLORS.violet,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  nextActionText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    marginTop: 5,
  },
  nextActionImpact: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },
  primaryButton: {
    marginTop: 14,
    minHeight: 45,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: COLORS.violet,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  statusContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 22,
  },
  statusRingWrap: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRingCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTotal: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "900",
  },
  statusTotalLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  statusLegend: {
    flex: 1,
    minWidth: 190,
    gap: 12,
  },
  statusLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statusLegendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  statusValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },
  statusPercent: {
    color: COLORS.textMuted,
    fontWeight: "600",
  },

  rankingList: {
    gap: 16,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankingNumber: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rankingNumberText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "900",
  },
  rankingMain: {
    flex: 1,
  },
  rankingTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rankingName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  rankingRevenue: {
    fontSize: 11,
    fontWeight: "900",
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
  },
  rankingHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 6,
  },

  clientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  clientSignal: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 135,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  clientSignalValue: {
    fontSize: 23,
    fontWeight: "900",
  },
  clientSignalLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },
  clientSignalHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  heatmapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  heatmapDaySpacer: {
    width: 40,
  },
  heatmapHour: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 8,
    textAlign: "center",
    fontWeight: "700",
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  heatmapDay: {
    width: 40,
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },
  heatCell: {
    flex: 1,
    aspectRatio: 1.55,
    maxHeight: 34,
    marginHorizontal: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 310,
    minWidth: 260,
    borderRadius: 20,
    borderWidth: 1,
    padding: 17,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 7,
  },
  actionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  actionBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  confidenceBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  confidenceText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    marginTop: 18,
  },
  actionDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },
  actionImpactBox: {
    marginTop: 16,
    borderRadius: 13,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.13)",
  },
  actionImpactLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionImpactValue: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
  },
  actionButton: {
    minHeight: 42,
    marginTop: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#071016",
    fontSize: 11,
    fontWeight: "900",
  },

  matrixGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  matrixCell: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 230,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  matrixMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  matrixMetaText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  matrixEffort: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },
  matrixTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 18,
  },
  matrixValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },

  revenueLayers: {
    gap: 10,
  },
  revenueLayer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
  },
  revenueLayerLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  revenueLayerValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  simulatorRow: {
    marginBottom: 18,
  },
  simulatorLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 9,
  },
  simulatorLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  simulatorValue: {
    color: COLORS.violet,
    fontSize: 11,
    fontWeight: "900",
  },
  simulatorTrack: {
    position: "relative",
    height: 7,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  simulatorFill: {
    height: "100%",
    borderRadius: 7,
    backgroundColor: COLORS.violet,
  },
  simulatorThumb: {
    position: "absolute",
    top: -4,
    width: 15,
    height: 15,
    marginLeft: -7,
    borderRadius: 15,
    backgroundColor: COLORS.text,
    borderWidth: 3,
    borderColor: COLORS.violet,
  },
  simulatorResult: {
    borderRadius: 17,
    padding: 15,
    backgroundColor: "rgba(57,245,166,0.09)",
    borderWidth: 1,
    borderColor: "rgba(57,245,166,0.18)",
  },
  simulatorResultLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  simulatorResultValue: {
    color: COLORS.emerald,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  simulatorDisclaimer: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 6,
  },

  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  pipelineIndex: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,138,0.12)",
  },
  pipelineIndexText: {
    color: COLORS.rose,
    fontSize: 11,
    fontWeight: "900",
  },
  pipelineCopy: {
    flex: 1,
  },
  pipelineTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  pipelineHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  pipelineCount: {
    color: COLORS.rose,
    fontSize: 11,
    fontWeight: "900",
  },

  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 14,
  },
  previewFooterText: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
});
