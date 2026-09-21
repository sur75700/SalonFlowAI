import React, { useMemo, useState } from 'react';
import { useDashboardTheme } from '../../../hooks/useDashboardTheme';
import DashboardThemeBackground from './DashboardThemeBackground';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  Pressable,
  Modal,
  SafeAreaView,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path as SvgPath,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export type TrendDirection = 'up' | 'down' | 'flat';

export type RevenueVisualVariant =
  | 'dashboardRoyal'
  | 'analyticsEmerald';

export interface RevenueSeriesPoint {
  label: string; // x-axis tick label, e.g. "May 6"
  value: number;
}

export interface RevenuePeriodOption {
  value: string;
  label: string;
}

export interface RevenueAnalyticsV2Props {
  title?: string; // default "Revenue Overview"
  periodLabel: string; // e.g. "This Month"
  periodOptions?: readonly RevenuePeriodOption[];
  selectedPeriod?: string;
  onPeriodChange?: (value: string) => void;
  totalValue: string; // pre-formatted, e.g. "$124,580"
  trendLabel: string; // pre-formatted, e.g. "+18.6%"
  trendDirection: TrendDirection;
  currentSeries: RevenueSeriesPoint[];
  /** Ideally same length/order as currentSeries so the two lines align */
  comparisonSeries?: RevenueSeriesPoint[];
  currentSeriesLabel?: string; // default "This Month"
  comparisonSeriesLabel?: string; // default "Last Month"
  axisValueFormatter?: (value: number) => string;
  visualVariant?: RevenueVisualVariant;
  previousIntervalLabel?: string;
  changeLabel?: string;
  changePercentLabel?: string;
  periodShareLabel?: string;
  intervalPositionLabel?: string;
  expandChartLabel?: string;
  closeExpandedChartLabel?: string;
  selectPeriodLabel?: string;
  /** Plot height in px — width is always measured/fluid */
  height?: number;
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
  cosmosBlue: '#4BBEFF',
  cosmosViolet: '#7C5CFF',
  cosmosMagenta: '#A855F7',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  positive: '#3FCF8E',
  danger: '#F2617A',
  gridLine: 'rgba(255,255,255,0.06)',
} as const;

type RevenueVisualPalette = {
  primary: string;
  lineStart: string;
  lineMid: string;
  lineEnd: string;
  beacon: string;
  peak: string;
  crosshair: string;
  comparison: string;
  readoutBorder: string;
  readoutValue: string;
};

const REVENUE_VISUAL_PALETTES: Record<
  RevenueVisualVariant,
  RevenueVisualPalette
> = {
  dashboardRoyal: {
    primary: colors.royal,
    lineStart: colors.cosmosBlue,
    lineMid: colors.cosmosViolet,
    lineEnd: colors.cosmosMagenta,
    beacon: '#7DF1FF',
    peak: '#90F4FF',
    crosshair: '#BFF9FF',
    comparison: colors.textTertiary,
    readoutBorder: 'rgba(125,241,255,0.17)',
    readoutValue: '#E8FCFF',
  },
  analyticsEmerald: {
    primary: '#35E89A',
    lineStart: '#18DC91',
    lineMid: '#45F2A7',
    lineEnd: '#B4FF72',
    beacon: '#D9FFEB',
    peak: '#86FFB8',
    crosshair: '#BFFFE0',
    comparison: '#6FAF98',
    readoutBorder: 'rgba(69,242,167,0.28)',
    readoutValue: '#DCFFEC',
  },
};


const trendColorMap: Record<TrendDirection, string> = {
  up: colors.positive,
  down: colors.danger,
  flat: colors.textTertiary,
};

const trendBgMap: Record<TrendDirection, string> = {
  up: 'rgba(63,207,142,0.14)',
  down: 'rgba(242,97,122,0.14)',
  flat: 'rgba(111,112,146,0.14)',
};

function defaultFormatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${Math.round(value)}`;
}

function TrendIndicator({ direction }: { direction: TrendDirection }) {
  const color = trendColorMap[direction];
  if (direction === 'flat') {
    return <View style={[styles.trendDash, { backgroundColor: color }]} />;
  }
  return (
    <View
      style={[
        direction === 'up' ? styles.triangleUp : styles.triangleDown,
        direction === 'up' ? { borderBottomColor: color } : { borderTopColor: color },
      ]}
    />
  );
}

interface ScaledPoint {
  x: number;
  y: number;
}

function scalePoints(
  series: RevenueSeriesPoint[],
  width: number,
  height: number,
  min: number,
  max: number
): ScaledPoint[] {
  const range = max - min || 1;
  const n = series.length;
  return series.map((point, i) => ({
    x: n === 1 ? width / 2 : (i / (n - 1)) * width,
    y: height - ((point.value - min) / range) * height,
  }));
}

const REVENUE_LINE_GRADIENT_ID = 'revenueCosmosLineGradient';
const REVENUE_AREA_GRADIENT_ID = 'revenueCosmosAreaGradient';
const REVENUE_DEPTH_GRADIENT_ID = 'revenueCosmosDepthGradient';
const REVENUE_FLOOR_GRADIENT_ID = 'revenueCosmosFloorGradient';

function svgNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}

/**
 * Smooth interpolation affects presentation only.
 * Trusted revenue values remain completely unchanged.
 */
function buildSmoothPath(points: ScaledPoint[]): string {
  if (points.length === 0) return '';

  if (points.length === 1) {
    return `M ${svgNumber(points[0].x)} ${svgNumber(points[0].y)}`;
  }

  let result =
    `M ${svgNumber(points[0].x)} ${svgNumber(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const previous = points[i - 1] ?? points[i];
    const current = points[i];
    const next = points[i + 1];
    const afterNext = points[i + 2] ?? next;

    const cp1x =
      current.x + (next.x - previous.x) / 6;
    const cp1y =
      current.y + (next.y - previous.y) / 6;

    const cp2x =
      next.x - (afterNext.x - current.x) / 6;
    const cp2y =
      next.y - (afterNext.y - current.y) / 6;

    result +=
      ` C ${svgNumber(cp1x)} ${svgNumber(cp1y)}` +
      ` ${svgNumber(cp2x)} ${svgNumber(cp2y)}` +
      ` ${svgNumber(next.x)} ${svgNumber(next.y)}`;
  }

  return result;
}

function buildAreaPath(
  points: ScaledPoint[],
  chartHeight: number
): string {
  if (points.length < 2) return '';

  const linePath = buildSmoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return (
    linePath +
    ` L ${svgNumber(last.x)} ${svgNumber(chartHeight)}` +
    ` L ${svgNumber(first.x)} ${svgNumber(chartHeight)} Z`
  );
}

function findPeakPoint(
  points: ScaledPoint[]
): ScaledPoint | undefined {
  if (points.length === 0) return undefined;

  return points.reduce(
    (peak, point) =>
      point.y < peak.y ? point : peak,
    points[0]
  );
}

const IMMERSIVE_LINE_GRADIENT_ID =
  'revenueImmersiveLineGradient';
const IMMERSIVE_AREA_GRADIENT_ID =
  'revenueImmersiveAreaGradient';
const IMMERSIVE_DEPTH_GRADIENT_ID =
  'revenueImmersiveDepthGradient';
const IMMERSIVE_FLOOR_GRADIENT_ID =
  'revenueImmersiveFloorGradient';
const IMMERSIVE_NEBULA_GRADIENT_ID =
  'revenueImmersiveNebulaGradient';

interface ImmersiveRevenueStageProps {
  currentSeries: RevenueSeriesPoint[];
  comparisonSeries?: RevenueSeriesPoint[];
  currentSeriesLabel: string;
  min: number;
  max: number;
  height: number;
  visualVariant: RevenueVisualVariant;
  previousIntervalLabel?: string;
  changeLabel?: string;
  changePercentLabel?: string;
  periodShareLabel?: string;
  intervalPositionLabel?: string;
  axisValueFormatter: (value: number) => string;
}

function ImmersiveRevenueStage({
  currentSeries,
  comparisonSeries,
  currentSeriesLabel,
  min,
  max,
  height,
  visualVariant,
  previousIntervalLabel,
  changeLabel,
  changePercentLabel,
  periodShareLabel,
  intervalPositionLabel,
  axisValueFormatter,
}: ImmersiveRevenueStageProps) {
  const palette = REVENUE_VISUAL_PALETTES[visualVariant];
  const isEmerald = visualVariant === 'analyticsEmerald';
  const [chartWidth, setChartWidth] = useState(0);
  const [activeIndex, setActiveIndex] =
    useState<number | null>(null);

  const seriesLength = currentSeries.length;

  const interactionPanResponder = useMemo(
    () => {
      const resolveIndexFromX = (
        xValue: number
      ): number | null => {
        if (
          chartWidth <= 0 ||
          seriesLength === 0
        ) {
          return null;
        }

        const x = Math.max(
          0,
          Math.min(chartWidth, xValue)
        );

        return seriesLength === 1
          ? 0
          : Math.round(
              (x / chartWidth) *
                (seriesLength - 1)
            );
      };

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (event) => {
          const index = resolveIndexFromX(
            event.nativeEvent.locationX
          );

          if (index !== null) {
            setActiveIndex(index);
          }
        },

        onPanResponderMove: (event) => {
          const index = resolveIndexFromX(
            event.nativeEvent.locationX
          );

          if (index !== null) {
            setActiveIndex(index);
          }
        },

        onPanResponderTerminationRequest:
          () => false,

        onShouldBlockNativeResponder:
          () => false,
      });
    },
    [chartWidth, seriesLength]
  );

  const currentScaled = useMemo(
    () => scalePoints(
      currentSeries,
      chartWidth,
      height,
      min,
      max
    ),
    [currentSeries, chartWidth, height, min, max]
  );

  const comparisonScaled = useMemo(
    () =>
      comparisonSeries
        ? scalePoints(
            comparisonSeries,
            chartWidth,
            height,
            min,
            max
          )
        : [],
    [
      comparisonSeries,
      chartWidth,
      height,
      min,
      max,
    ]
  );

  const currentPath = useMemo(
    () => buildSmoothPath(currentScaled),
    [currentScaled]
  );

  const comparisonPath = useMemo(
    () => buildSmoothPath(comparisonScaled),
    [comparisonScaled]
  );

  const areaPath = useMemo(
    () => buildAreaPath(currentScaled, height),
    [currentScaled, height]
  );

  const peakPoint = useMemo(
    () => findPeakPoint(currentScaled),
    [currentScaled]
  );

  const lastPoint =
    currentScaled[currentScaled.length - 1];

  const resolvedActiveIndex =
    seriesLength === 0
      ? null
      : Math.min(
          activeIndex ?? seriesLength - 1,
          seriesLength - 1
        );

  const activePoint =
    resolvedActiveIndex === null
      ? undefined
      : currentSeries[resolvedActiveIndex];

  const activeScaledPoint =
    resolvedActiveIndex === null
      ? undefined
      : currentScaled[resolvedActiveIndex];

  const previousPoint =
    resolvedActiveIndex !== null &&
    resolvedActiveIndex > 0
      ? currentSeries[
          resolvedActiveIndex - 1
        ]
      : undefined;

  const periodTotal = useMemo(
    () =>
      currentSeries.reduce(
        (sum, point) =>
          sum + point.value,
        0
      ),
    [currentSeries]
  );

  const activeDelta =
    activePoint && previousPoint
      ? activePoint.value -
        previousPoint.value
      : null;

  const activeDeltaPercent =
    activeDelta !== null &&
    previousPoint &&
    previousPoint.value !== 0
      ? (
          activeDelta /
          Math.abs(
            previousPoint.value
          )
        ) * 100
      : null;

  const activeShare =
    activePoint &&
    periodTotal !== 0
      ? (
          activePoint.value /
          periodTotal
        ) * 100
      : null;

  const activeDeltaColor =
    activeDelta === null ||
    activeDelta === 0
      ? palette.lineStart
      : activeDelta > 0
        ? colors.positive
        : colors.danger;

  const activeDeltaBackground =
    activeDelta === null ||
    activeDelta === 0
      ? 'rgba(75,190,255,0.10)'
      : activeDelta > 0
        ? 'rgba(63,207,142,0.10)'
        : 'rgba(242,97,122,0.10)';

  const activePercentColor =
    activeDeltaPercent === null ||
    activeDeltaPercent === 0
      ? palette.lineStart
      : activeDeltaPercent > 0
        ? colors.positive
        : colors.danger;

  const activePercentBackground =
    activeDeltaPercent === null ||
    activeDeltaPercent === 0
      ? 'rgba(75,190,255,0.10)'
      : activeDeltaPercent > 0
        ? 'rgba(63,207,142,0.10)'
        : 'rgba(242,97,122,0.10)';

  const floorTop = height * 0.76;

  const floorInset = Math.min(
    72,
    Math.max(chartWidth * 0.065, 22)
  );

  const floorPoints =
    `0,${svgNumber(floorTop)} ` +
    `${svgNumber(chartWidth)},${svgNumber(floorTop)} ` +
    `${svgNumber(
      Math.max(chartWidth - floorInset, 0)
    )},${svgNumber(height)} ` +
    `${svgNumber(floorInset)},${svgNumber(height)}`;

  const labelStep =
    currentSeries.length > 8
      ? Math.ceil(currentSeries.length / 7)
      : 1;

  const yAxisSteps = [1, 0.75, 0.5, 0.25, 0];

  const perspectivePositions = [
    0.08,
    0.22,
    0.36,
    0.5,
    0.64,
    0.78,
    0.92,
  ];

  return (
    <>
      <View style={styles.immersiveChartRow}>
        <View
          style={[
            styles.immersiveYAxis,
            { height },
          ]}
        >
          {yAxisSteps.map((step) => (
            <Text
              key={step}
              style={styles.immersiveYAxisLabel}
            >
              {axisValueFormatter(
                min + (max - min) * step
              )}
            </Text>
          ))}
        </View>

        <View
          style={[
            styles.immersivePlot,
            { height },
          ]}
          onLayout={(event) =>
            setChartWidth(
              event.nativeEvent.layout.width
            )
          }
        >
          {chartWidth > 0 && (
            <Svg
              width={chartWidth}
              height={height}
              viewBox={`0 0 ${chartWidth} ${height}`}
            >
              <Defs>
                <RadialGradient
                  id={IMMERSIVE_NEBULA_GRADIENT_ID}
                  cx="48%"
                  cy="38%"
                  r="74%"
                >
                  <Stop
                    offset="0%"
                    stopColor={palette.lineStart}
                    stopOpacity={0.13}
                  />
                  <Stop
                    offset="38%"
                    stopColor={palette.lineMid}
                    stopOpacity={0.07}
                  />
                  <Stop
                    offset="100%"
                    stopColor={colors.surface}
                    stopOpacity={0}
                  />
                </RadialGradient>

                <LinearGradient
                  id={IMMERSIVE_LINE_GRADIENT_ID}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <Stop
                    offset="0%"
                    stopColor={palette.lineStart}
                  />
                  <Stop
                    offset="48%"
                    stopColor="#70E7FF"
                  />
                  <Stop
                    offset="72%"
                    stopColor={palette.lineMid}
                  />
                  <Stop
                    offset="100%"
                    stopColor={palette.lineEnd}
                  />
                </LinearGradient>

                <LinearGradient
                  id={IMMERSIVE_AREA_GRADIENT_ID}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <Stop
                    offset="0%"
                    stopColor={palette.lineStart}
                    stopOpacity={0.38}
                  />
                  <Stop
                    offset="44%"
                    stopColor={palette.lineMid}
                    stopOpacity={0.19}
                  />
                  <Stop
                    offset="100%"
                    stopColor={palette.lineEnd}
                    stopOpacity={0.025}
                  />
                </LinearGradient>

                <LinearGradient
                  id={IMMERSIVE_DEPTH_GRADIENT_ID}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <Stop
                    offset="0%"
                    stopColor={palette.lineEnd}
                    stopOpacity={0.22}
                  />
                  <Stop
                    offset="100%"
                    stopColor={palette.lineMid}
                    stopOpacity={0}
                  />
                </LinearGradient>

                <LinearGradient
                  id={IMMERSIVE_FLOOR_GRADIENT_ID}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <Stop
                    offset="0%"
                    stopColor={palette.lineMid}
                    stopOpacity={0.20}
                  />
                  <Stop
                    offset="100%"
                    stopColor={palette.lineStart}
                    stopOpacity={0.015}
                  />
                </LinearGradient>
              </Defs>

              <Rect
                width={chartWidth}
                height={height}
                fill={`url(#${IMMERSIVE_NEBULA_GRADIENT_ID})`}
              />

              {yAxisSteps.map((step) => {
                const y =
                  height -
                  height * step;

                return (
                  <Line
                    key={`horizontal-${step}`}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth={1}
                  />
                );
              })}

              <Polygon
                points={floorPoints}
                fill={`url(#${IMMERSIVE_FLOOR_GRADIENT_ID})`}
              />

              <Line
                x1={0}
                y1={floorTop}
                x2={chartWidth}
                y2={floorTop}
                stroke={palette.lineMid}
                strokeWidth={1.2}
                opacity={0.22}
              />

              {perspectivePositions.map(
                (position) => {
                  const bottomX =
                    chartWidth * position;

                  const horizonX =
                    chartWidth *
                    (
                      0.5 +
                      (position - 0.5) * 0.68
                    );

                  return (
                    <Line
                      key={`perspective-${position}`}
                      x1={horizonX}
                      y1={floorTop}
                      x2={bottomX}
                      y2={height}
                      stroke={palette.lineStart}
                      strokeWidth={1}
                      opacity={0.075}
                    />
                  );
                }
              )}

              {!!areaPath && (
                <>
                  <SvgPath
                    d={areaPath}
                    fill={`url(#${IMMERSIVE_DEPTH_GRADIENT_ID})`}
                    opacity={0.62}
                    transform="translate(0 14)"
                  />

                  <SvgPath
                    d={areaPath}
                    fill={`url(#${IMMERSIVE_AREA_GRADIENT_ID})`}
                  />
                </>
              )}

              {!!comparisonPath && (
                <SvgPath
                  d={comparisonPath}
                  fill="none"
                  stroke={palette.comparison}
                  strokeWidth={2}
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.72}
                />
              )}

              {!!currentPath && (
                <>
                  <SvgPath
                    d={currentPath}
                    fill="none"
                    stroke={palette.lineMid}
                    strokeWidth={isEmerald ? 24 : 22}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.055}
                  />

                  <SvgPath
                    d={currentPath}
                    fill="none"
                    stroke={palette.lineStart}
                    strokeWidth={isEmerald ? 14 : 12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.12}
                  />

                  <SvgPath
                    d={currentPath}
                    fill="none"
                    stroke={palette.beacon}
                    strokeWidth={isEmerald ? 6.4 : 5.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.22}
                  />

                  <SvgPath
                    d={currentPath}
                    fill="none"
                    stroke={`url(#${IMMERSIVE_LINE_GRADIENT_ID})`}
                    strokeWidth={isEmerald ? 3.8 : 3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {!!activeScaledPoint && (
                <>
                  <Line
                    x1={activeScaledPoint.x}
                    y1={0}
                    x2={activeScaledPoint.x}
                    y2={height}
                    stroke={palette.crosshair}
                    strokeWidth={1}
                    strokeDasharray="4 6"
                    opacity={0.34}
                  />

                  <Line
                    x1={0}
                    y1={activeScaledPoint.y}
                    x2={chartWidth}
                    y2={activeScaledPoint.y}
                    stroke={palette.lineMid}
                    strokeWidth={1}
                    strokeDasharray="3 8"
                    opacity={0.18}
                  />

                  <Circle
                    cx={activeScaledPoint.x}
                    cy={activeScaledPoint.y}
                    r={22}
                    fill={palette.lineStart}
                    opacity={0.045}
                  />

                  <Circle
                    cx={activeScaledPoint.x}
                    cy={activeScaledPoint.y}
                    r={12}
                    fill={palette.lineMid}
                    opacity={0.10}
                  />

                  <Circle
                    cx={activeScaledPoint.x}
                    cy={activeScaledPoint.y}
                    r={6}
                    fill={palette.beacon}
                    opacity={0.30}
                  />

                  <Circle
                    cx={activeScaledPoint.x}
                    cy={activeScaledPoint.y}
                    r={3}
                    fill={colors.textPrimary}
                  />
                </>
              )}

              {!!peakPoint && (
                <>
                  <Circle
                    cx={peakPoint.x}
                    cy={peakPoint.y}
                    r={20}
                    fill={palette.lineStart}
                    opacity={0.045}
                  />
                  <Circle
                    cx={peakPoint.x}
                    cy={peakPoint.y}
                    r={11}
                    fill={palette.lineStart}
                    opacity={0.09}
                  />
                  <Circle
                    cx={peakPoint.x}
                    cy={peakPoint.y}
                    r={5}
                    fill={palette.peak}
                    opacity={0.30}
                  />
                  <Circle
                    cx={peakPoint.x}
                    cy={peakPoint.y}
                    r={2.8}
                    fill={colors.textPrimary}
                  />
                </>
              )}

              {!!lastPoint && (
                <>
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r={14}
                    fill={palette.lineEnd}
                    opacity={0.08}
                  />
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r={6}
                    fill={palette.lineMid}
                    opacity={0.28}
                  />
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r={3}
                    fill={colors.textPrimary}
                  />
                </>
              )}
            </Svg>
          )}

          {!!activePoint && (
            <View
              pointerEvents="none"
              style={[
                  styles.interactionReadout,
                  {
                    width:
                      chartWidth < 560
                        ? 214
                        : 254,
                    paddingHorizontal:
                      chartWidth < 560
                        ? 14
                        : 18,
                    paddingVertical:
                      chartWidth < 560
                        ? 13
                        : 16,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderLeftWidth: 3,
                    borderColor:
                      activeDeltaColor,
                    backgroundColor:
                      'rgba(8,11,34,0.97)',
                    shadowColor:
                      activeDeltaColor,
                    shadowOpacity: 0.24,
                    shadowRadius: 18,
                    shadowOffset: {
                      width: 0,
                      height: 8,
                    },
                    elevation: 8,
                  },
                ]}
            >
              <Text
                style={[
                    styles.interactionDate,
                    {
                      color:
                        colors.textSecondary,
                      fontSize: 12,
                      lineHeight: 16,
                      fontWeight: '700',
                      letterSpacing: 0.25,
                    },
                  ]}
                numberOfLines={1}
              >
                {activePoint.label}
              </Text>

              <Text
                style={[
                    styles.interactionValue,
                    {
                      color:
                        colors.textPrimary,
                      fontSize:
                        chartWidth < 560
                          ? 21
                          : 25,
                      lineHeight:
                        chartWidth < 560
                          ? 26
                          : 30,
                      fontWeight: '900',
                      letterSpacing: -0.4,
                      marginTop: 4,
                    },
                  ]}
                numberOfLines={1}
              >
                {axisValueFormatter(
                  activePoint.value
                )}
              </Text>

              {previousPoint && previousIntervalLabel ? (
                <Text
                  style={styles.interactionReference}
                  numberOfLines={2}
                >
                  {previousIntervalLabel}: {previousPoint.label} · {axisValueFormatter(previousPoint.value)}
                </Text>
              ) : null}

              <View
                  style={[
                    styles.interactionStats,
                    {
                      marginTop: 12,
                      flexWrap: 'wrap',
                      gap: 8,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexBasis: '47%',
                      minWidth: 88,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 11,
                      borderWidth: 1,
                      borderColor:
                        activeDeltaColor,
                      backgroundColor:
                        activeDeltaBackground,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          colors.textTertiary,
                        fontSize: 9,
                        lineHeight: 12,
                        fontWeight: '800',
                        letterSpacing: 0.55,
                      }}
                    >
                      {changeLabel ?? 'Δ'}
                    </Text>
                    <Text
                      style={{
                        color:
                          activeDeltaColor,
                        fontSize: 12,
                        lineHeight: 17,
                        fontWeight: '900',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {activeDelta === null
                        ? '—'
                        : `${
                            activeDelta >= 0
                              ? '+'
                              : ''
                          }${axisValueFormatter(
                            activeDelta
                          )}`}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexBasis: '47%',
                      minWidth: 88,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 11,
                      borderWidth: 1,
                      borderColor:
                        activePercentColor,
                      backgroundColor:
                        activePercentBackground,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          colors.textTertiary,
                        fontSize: 9,
                        lineHeight: 12,
                        fontWeight: '800',
                        letterSpacing: 0.55,
                      }}
                    >
                      {changePercentLabel ?? 'Δ%'}
                    </Text>
                    <Text
                      style={{
                        color:
                          activePercentColor,
                        fontSize: 12,
                        lineHeight: 17,
                        fontWeight: '900',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {activeDeltaPercent === null
                        ? '—'
                        : `${
                            activeDeltaPercent >= 0
                              ? '+'
                              : ''
                          }${activeDeltaPercent.toFixed(
                            1
                          )}%`}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexBasis: '47%',
                      minWidth: 88,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 11,
                      borderWidth: 1,
                      borderColor:
                        palette.lineStart,
                      backgroundColor:
                        'rgba(75,190,255,0.10)',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          colors.textTertiary,
                        fontSize: 9,
                        lineHeight: 12,
                        fontWeight: '800',
                        letterSpacing: 0.55,
                      }}
                    >
                      {periodShareLabel ?? 'Σ'}
                    </Text>
                    <Text
                      style={{
                        color:
                          palette.lineStart,
                        fontSize: 12,
                        lineHeight: 17,
                        fontWeight: '900',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {activeShare === null
                        ? '—'
                        : `${activeShare.toFixed(
                            1
                          )}%`}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexBasis: '47%',
                      minWidth: 88,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 11,
                      borderWidth: 1,
                      borderColor:
                        palette.lineMid,
                      backgroundColor:
                        isEmerald
                          ? 'rgba(69,242,167,0.10)'
                          : 'rgba(124,92,255,0.10)',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          colors.textTertiary,
                        fontSize: 9,
                        lineHeight: 12,
                        fontWeight: '800',
                        letterSpacing: 0.55,
                      }}
                    >
                      {intervalPositionLabel ?? '#'}
                    </Text>
                    <Text
                      style={{
                        color:
                          palette.lineMid,
                        fontSize: 12,
                        lineHeight: 17,
                        fontWeight: '900',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {(resolvedActiveIndex ??
                        0) + 1}
                      {' / '}
                      {seriesLength}
                    </Text>
                  </View>
                </View>
            </View>
          )}

          <View
            {...interactionPanResponder.panHandlers}
            style={
              styles.interactionSurface
            }
            accessibilityRole="adjustable"
            accessibilityLabel={
              currentSeriesLabel
            }
            accessibilityValue={{
              text: activePoint
                ? `${activePoint.label}, ${axisValueFormatter(
                    activePoint.value
                  )}`
                : currentSeriesLabel,
            }}
            accessibilityActions={[
              { name: 'increment' },
              { name: 'decrement' },
            ]}
            onAccessibilityAction={(
              event
            ) => {
              if (seriesLength === 0) {
                return;
              }

              const current =
                resolvedActiveIndex ??
                seriesLength - 1;

              if (
                event.nativeEvent
                  .actionName ===
                'increment'
              ) {
                setActiveIndex(
                  Math.min(
                    current + 1,
                    seriesLength - 1
                  )
                );
              }

              if (
                event.nativeEvent
                  .actionName ===
                'decrement'
              ) {
                setActiveIndex(
                  Math.max(
                    current - 1,
                    0
                  )
                );
              }
            }}
          />
        </View>
      </View>

      <View style={styles.immersiveXAxisRow}>
        {currentSeries.map((point, index) => {
          const show =
            index % labelStep === 0 ||
            index === currentSeries.length - 1;

          return (
            <View
              key={`${point.label}-${index}`}
              style={styles.immersiveXAxisCell}
            >
              {show && (
                <Text
                  style={styles.immersiveXAxisLabel}
                  numberOfLines={1}
                >
                  {point.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </>
  );
}

/**
 * RevenueAnalyticsV2 — premium "Revenue Overview" card. Presentation-only:
 * every number and data point arrives via props. The plot uses the already
 * installed react-native-svg runtime for a Royal Cosmos 2.5D visualization
 * without adding polling, requests, timers, or perpetual animation loops.
 */
function RevenueAnalyticsV2({
  title = 'Revenue Overview',
  periodLabel,
  periodOptions = [],
  selectedPeriod,
  onPeriodChange,
  totalValue,
  trendLabel,
  trendDirection,
  currentSeries,
  comparisonSeries,
  currentSeriesLabel = 'This Month',
  comparisonSeriesLabel = 'Last Month',
  axisValueFormatter = defaultFormatAxisValue,
  visualVariant = 'dashboardRoyal',
  previousIntervalLabel,
  changeLabel,
  changePercentLabel,
  periodShareLabel,
  intervalPositionLabel,
  expandChartLabel,
  closeExpandedChartLabel,
  selectPeriodLabel,
  height = 200,
}: RevenueAnalyticsV2Props) {
  const palette = REVENUE_VISUAL_PALETTES[visualVariant];
  const isEmerald = visualVariant === 'analyticsEmerald';
  const { theme } = useDashboardTheme();
  const [chartWidth, setChartWidth] = useState(0);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [immersiveOpen, setImmersiveOpen] = useState(false);

  const { height: viewportHeight } =
    useWindowDimensions();

  const immersiveHeight = Math.max(
    220,
    Math.min(viewportHeight * 0.61, 620)
  );

  const canSelectPeriod =
    periodOptions.length > 1 &&
    typeof onPeriodChange === 'function';

  const selectPeriod = (value: string) => {
    onPeriodChange?.(value);
    setPeriodMenuOpen(false);
  };

  const onChartLayout = (e: LayoutChangeEvent) =>
    setChartWidth(e.nativeEvent.layout.width);

  const { min, max } = useMemo(() => {
    const all = [...currentSeries, ...(comparisonSeries ?? [])].map((p) => p.value);
    return { min: Math.min(...all, 0), max: Math.max(...all, 1) };
  }, [currentSeries, comparisonSeries]);

  const currentScaled = useMemo(
    () => scalePoints(currentSeries, chartWidth, height, min, max),
    [currentSeries, chartWidth, height, min, max]
  );
  const comparisonScaled = useMemo(
    () => (comparisonSeries ? scalePoints(comparisonSeries, chartWidth, height, min, max) : []),
    [comparisonSeries, chartWidth, height, min, max]
  );

  const currentPath = useMemo(
    () => buildSmoothPath(currentScaled),
    [currentScaled]
  );

  const comparisonPath = useMemo(
    () => buildSmoothPath(comparisonScaled),
    [comparisonScaled]
  );

  const currentAreaPath = useMemo(
    () => buildAreaPath(currentScaled, height),
    [currentScaled, height]
  );

  const peakPoint = useMemo(
    () => findPeakPoint(currentScaled),
    [currentScaled]
  );

  const yAxisSteps = [1, 0.75, 0.5, 0.25, 0];
  const lastPoint = currentScaled[currentScaled.length - 1];

  const showPeakNode = Boolean(
    peakPoint &&
      (!lastPoint ||
        Math.abs(peakPoint.x - lastPoint.x) > 0.5 ||
        Math.abs(peakPoint.y - lastPoint.y) > 0.5)
  );

  const floorTop = Math.max(
    height - 28,
    height * 0.82
  );

  const floorInset = Math.min(
    14,
    Math.max(chartWidth / 8, 6)
  );

  const floorPoints =
    `0,${svgNumber(floorTop)} ` +
    `${svgNumber(chartWidth)},${svgNumber(floorTop)} ` +
    `${svgNumber(Math.max(chartWidth - floorInset, 0))},${svgNumber(height)} ` +
    `${svgNumber(floorInset)},${svgNumber(height)}`;

  const labelStep =
    currentSeries.length > 6
      ? Math.ceil(currentSeries.length / 5)
      : 1;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isEmerald
            ? 'rgba(7,11,32,0.74)'
            : theme.palette.surface,
          borderColor: isEmerald
            ? palette.readoutBorder
            : theme.palette.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              expandChartLabel ?? `${title}: expand chart`
            }
            onPress={() => setImmersiveOpen(true)}
            style={({ pressed }) => [
              styles.expandButton,
              pressed && styles.expandButtonPressed,
            ]}
          >
            <View style={styles.expandGlyph}>
              <View
                style={[
                  styles.expandCorner,
                  styles.expandCornerTopLeft,
                ]}
              />
              <View
                style={[
                  styles.expandCorner,
                  styles.expandCornerTopRight,
                ]}
              />
              <View
                style={[
                  styles.expandCorner,
                  styles.expandCornerBottomLeft,
                ]}
              />
              <View
                style={[
                  styles.expandCorner,
                  styles.expandCornerBottomRight,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectPeriodLabel
                ? `${selectPeriodLabel}: ${periodLabel}`
                : `Select revenue period. Current: ${periodLabel}`
            }
            disabled={!canSelectPeriod}
            onPress={() =>
              setPeriodMenuOpen((open) => !open)
            }
            style={({ pressed }) => [
              styles.periodChip,
              {
                backgroundColor: theme.palette.surfaceRaised,
                borderColor: theme.palette.border,
              },
              pressed &&
                canSelectPeriod &&
                styles.periodChipPressed,
            ]}
          >
            <Text style={styles.periodChipText}>
              {periodLabel}
            </Text>
            <View style={styles.chevronDown} />
          </Pressable>
        </View>
      </View>

      {periodMenuOpen && canSelectPeriod && (
        <View style={styles.periodMenu}>
          {periodOptions.map((option) => {
            const active = option.value === selectedPeriod;

            return (
              <Pressable
                key={option.value}
                onPress={() => selectPeriod(option.value)}
                style={({ pressed }) => [
                  styles.periodOption,
                  {
                    backgroundColor: theme.palette.surfaceRaised,
                    borderColor: theme.palette.border,
                  },
                  active && styles.periodOptionActive,
                  pressed && styles.periodOptionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    active && styles.periodOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <Text style={styles.totalValue} numberOfLines={1}>
            {totalValue}
          </Text>
          <View style={[styles.trendPill, { backgroundColor: trendBgMap[trendDirection] }]}>
            <TrendIndicator direction={trendDirection} />
            <Text style={[styles.trendText, { color: trendColorMap[trendDirection] }]}>{trendLabel}</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: palette.primary }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {currentSeriesLabel}
            </Text>
          </View>
          {!!comparisonSeries && (
            <View style={styles.legendRow}>
              <View
              style={[
                styles.legendDashDot,
                { backgroundColor: palette.comparison },
              ]}
            />
              <Text style={styles.legendText} numberOfLines={1}>
                {comparisonSeriesLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.chartRow}>
        <View style={[styles.yAxis, { height }]}>
          {yAxisSteps.map((step) => (
            <Text key={step} style={styles.yAxisLabel}>
              {axisValueFormatter(min + (max - min) * step)}
            </Text>
          ))}
        </View>

        <View style={styles.chartPlot} onLayout={onChartLayout}>
          <View style={[styles.gridLines, { height }]} pointerEvents="none">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          {chartWidth > 0 && (
            <View
              style={{ width: chartWidth, height }}
              pointerEvents="none"
            >
              <Svg
                width={chartWidth}
                height={height}
                viewBox={`0 0 ${chartWidth} ${height}`}
              >
                <Defs>
                  <LinearGradient
                    id={REVENUE_LINE_GRADIENT_ID}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={palette.lineStart}
                    />
                    <Stop
                      offset="55%"
                      stopColor={palette.lineMid}
                    />
                    <Stop
                      offset="100%"
                      stopColor={palette.lineEnd}
                    />
                  </LinearGradient>

                  <LinearGradient
                    id={REVENUE_AREA_GRADIENT_ID}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={palette.lineStart}
                      stopOpacity={0.30}
                    />
                    <Stop
                      offset="48%"
                      stopColor={palette.lineMid}
                      stopOpacity={0.16}
                    />
                    <Stop
                      offset="100%"
                      stopColor={palette.lineMid}
                      stopOpacity={0.02}
                    />
                  </LinearGradient>

                  <LinearGradient
                    id={REVENUE_DEPTH_GRADIENT_ID}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={palette.lineEnd}
                      stopOpacity={0.15}
                    />
                    <Stop
                      offset="100%"
                      stopColor={palette.lineMid}
                      stopOpacity={0}
                    />
                  </LinearGradient>

                  <LinearGradient
                    id={REVENUE_FLOOR_GRADIENT_ID}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={palette.lineMid}
                      stopOpacity={0.12}
                    />
                    <Stop
                      offset="100%"
                      stopColor={palette.lineStart}
                      stopOpacity={0.015}
                    />
                  </LinearGradient>
                </Defs>

                <Polygon
                  points={floorPoints}
                  fill={`url(#${REVENUE_FLOOR_GRADIENT_ID})`}
                />

                {!!currentAreaPath && (
                  <>
                    <SvgPath
                      d={currentAreaPath}
                      fill={`url(#${REVENUE_DEPTH_GRADIENT_ID})`}
                      opacity={0.55}
                      transform="translate(0 7)"
                    />

                    <SvgPath
                      d={currentAreaPath}
                      fill={`url(#${REVENUE_AREA_GRADIENT_ID})`}
                    />
                  </>
                )}

                {!!comparisonPath && (
                  <SvgPath
                    d={comparisonPath}
                    fill="none"
                    stroke={palette.comparison}
                    strokeWidth={1.6}
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.72}
                  />
                )}

                {!!currentPath && (
                  <>
                    <SvgPath
                      d={currentPath}
                      fill="none"
                      stroke={palette.lineMid}
                      strokeWidth={isEmerald ? 14 : 12}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.07}
                    />

                    <SvgPath
                      d={currentPath}
                      fill="none"
                      stroke={palette.lineStart}
                      strokeWidth={isEmerald ? 8.5 : 7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.12}
                    />

                    <SvgPath
                      d={currentPath}
                      fill="none"
                      stroke={`url(#${REVENUE_LINE_GRADIENT_ID})`}
                      strokeWidth={isEmerald ? 3.4 : 2.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {showPeakNode && peakPoint && (
                  <>
                    <Circle
                      cx={peakPoint.x}
                      cy={peakPoint.y}
                      r={10}
                      fill={palette.lineStart}
                      opacity={0.08}
                    />
                    <Circle
                      cx={peakPoint.x}
                      cy={peakPoint.y}
                      r={5}
                      fill={palette.lineStart}
                      opacity={0.22}
                    />
                    <Circle
                      cx={peakPoint.x}
                      cy={peakPoint.y}
                      r={2.6}
                      fill={colors.textPrimary}
                    />
                  </>
                )}

                {!!lastPoint && (
                  <>
                    <Circle
                      cx={lastPoint.x}
                      cy={lastPoint.y}
                      r={9}
                      fill={palette.lineMid}
                      opacity={0.16}
                    />
                    <Circle
                      cx={lastPoint.x}
                      cy={lastPoint.y}
                      r={4.5}
                      fill={palette.lineMid}
                      stroke={colors.surface}
                      strokeWidth={2}
                    />
                  </>
                )}
              </Svg>
            </View>
          )}
        </View>
      </View>

      <View style={styles.xAxisRow}>
        {currentSeries.map((point, i) => {
          const show = i % labelStep === 0 || i === currentSeries.length - 1;
          return (
            <View key={`${point.label}-${i}`} style={styles.xAxisCell}>
              {show && (
                <Text style={styles.xAxisLabel} numberOfLines={1}>
                  {point.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <Modal
        visible={immersiveOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImmersiveOpen(false)}
      >
        <DashboardThemeBackground style={styles.immersiveBackdrop}>
        <SafeAreaView
          style={[
            styles.immersiveRoot,
            isEmerald && styles.immersiveRootEmerald,
          ]}
        >
          <View
            pointerEvents="none"
            style={styles.immersiveHaloBlue}
          />
          <View
            pointerEvents="none"
            style={styles.immersiveHaloViolet}
          />

          <View style={styles.immersiveTopBar}>
            <View style={styles.immersiveIdentity}>
              <Text style={styles.immersiveTitle}>
                {title}
              </Text>

              <View style={styles.immersiveMetricRow}>
                <Text
                  style={styles.immersiveTotal}
                  numberOfLines={1}
                >
                  {totalValue}
                </Text>

                <View
                  style={[
                    styles.trendPill,
                    {
                      backgroundColor:
                        trendBgMap[trendDirection],
                    },
                  ]}
                >
                  <TrendIndicator
                    direction={trendDirection}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color:
                          trendColorMap[
                            trendDirection
                          ],
                      },
                    ]}
                  >
                    {trendLabel}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                closeExpandedChartLabel ??
                `${title}: close expanded chart`
              }
              onPress={() => setImmersiveOpen(false)}
              style={({ pressed }) => [
                styles.immersiveClose,
                pressed && styles.immersiveClosePressed,
              ]}
            >
              <Text style={styles.immersiveCloseText}>
                ×
              </Text>
            </Pressable>
          </View>

          {canSelectPeriod && (
            <View style={styles.immersivePeriodRow}>
              {periodOptions.map((option) => {
                const active =
                  option.value === selectedPeriod;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    onPress={() =>
                      selectPeriod(option.value)
                    }
                    style={({ pressed }) => [
                      styles.immersivePeriodOption,
                      active &&
                        styles.immersivePeriodOptionActive,
                      pressed &&
                        styles.immersivePeriodOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.immersivePeriodText,
                        active &&
                          styles.immersivePeriodTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.immersiveChartShell}>
            <ImmersiveRevenueStage
              key={selectedPeriod ?? periodLabel}
              currentSeries={currentSeries}
              comparisonSeries={comparisonSeries}
              currentSeriesLabel={currentSeriesLabel}
              min={min}
              max={max}
              height={immersiveHeight}
              axisValueFormatter={axisValueFormatter}
              visualVariant={visualVariant}
              previousIntervalLabel={previousIntervalLabel}
              changeLabel={changeLabel}
              changePercentLabel={changePercentLabel}
              periodShareLabel={periodShareLabel}
              intervalPositionLabel={intervalPositionLabel}
            />
          </View>

          <View style={styles.immersiveFooter}>
            <View style={styles.immersiveFooterItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      palette.lineStart,
                  },
                ]}
              />
              <Text style={styles.immersiveFooterText}>
                {currentSeriesLabel}
              </Text>
            </View>

            {!!comparisonSeries && (
              <View style={styles.immersiveFooterItem}>
                <View
                  style={[
                    styles.legendDashDot,
                    { backgroundColor: palette.comparison },
                  ]}
                />
                <Text style={styles.immersiveFooterText}>
                  {comparisonSeriesLabel}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
        </DashboardThemeBackground>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 6,
  },
  periodChipPressed: {
    opacity: 0.7,
  },
  periodMenu: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodOption: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodOptionActive: {
    backgroundColor: 'rgba(124,92,255,0.22)',
    borderColor: 'rgba(124,92,255,0.62)',
  },
  periodOptionPressed: {
    opacity: 0.7,
  },
  periodOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  periodOptionTextActive: {
    color: colors.textPrimary,
  },
  chevronDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.textTertiary,
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.textPrimary,
    marginRight: 10,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  legend: {
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  legendDashDot: {
    width: 7,
    height: 2,
    borderRadius: 1,
    marginRight: 6,
    backgroundColor: colors.textTertiary,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartRow: {
    marginTop: 20,
    flexDirection: 'row',
  },
  yAxis: {
    width: 36,
    marginRight: 8,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  chartPlot: {
    flex: 1,
    minWidth: 0,
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gridLine,
    width: '100%',
  },
  pointLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  pointOuterRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(124,92,255,0.20)',
  },
  pointDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.royal,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  xAxisRow: {
    marginTop: 8,
    flexDirection: 'row',
    paddingLeft: 44,
  },
  xAxisCell: {
    flex: 1,
    alignItems: 'center',
  },
  xAxisLabel: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  trendDash: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  triangleUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  expandButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },

  expandButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  expandGlyph: {
    width: 15,
    height: 15,
    position: 'relative',
  },

  expandCorner: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderColor: colors.textSecondary,
  },

  expandCornerTopLeft: {
    left: 0,
    top: 0,
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
  },

  expandCornerTopRight: {
    right: 0,
    top: 0,
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
  },

  expandCornerBottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
  },

  expandCornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
  },

  immersiveBackdrop: {
    flex: 1,
  },

  immersiveRoot: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#070A1C',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },

  immersiveRootEmerald: {
    backgroundColor: 'rgba(5,9,24,0.72)',
  },

  immersiveHaloBlue: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(75,190,255,0.055)',
    top: -220,
    left: -140,
  },

  immersiveHaloViolet: {
    position: 'absolute',
    width: 620,
    height: 620,
    borderRadius: 310,
    backgroundColor: 'rgba(124,92,255,0.055)',
    bottom: -300,
    right: -210,
  },

  immersiveTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 2,
  },

  immersiveIdentity: {
    flex: 1,
    paddingRight: 16,
  },

  immersiveTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  immersiveMetricRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },

  immersiveTotal: {
    color: colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },

  immersiveClose: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.065)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  immersiveClosePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  immersiveCloseText: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '300',
    lineHeight: 27,
  },

  immersivePeriodRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    zIndex: 2,
  },

  immersivePeriodOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.085)',
  },

  immersivePeriodOptionActive: {
    backgroundColor: 'rgba(124,92,255,0.20)',
    borderColor: 'rgba(112,231,255,0.52)',
  },

  immersivePeriodOptionPressed: {
    opacity: 0.72,
  },

  immersivePeriodText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  immersivePeriodTextActive: {
    color: '#DDFBFF',
  },

  immersiveChartShell: {
    marginTop: 18,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(112,231,255,0.14)',
    backgroundColor: 'rgba(13,16,45,0.92)',
    overflow: 'hidden',
    zIndex: 1,
  },

  immersiveChartRow: {
    flexDirection: 'row',
  },

  immersiveYAxis: {
    width: 54,
    marginRight: 10,
    justifyContent: 'space-between',
  },

  immersiveYAxisLabel: {
    color: 'rgba(220,232,255,0.56)',
    fontSize: 11,
    fontWeight: '600',
  },

  immersivePlot: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: 18,
  },

  interactionSurface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    backgroundColor: 'transparent',
  },

  interactionReadout: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 4,
    minWidth: 170,
    maxWidth: 270,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor:
      'rgba(9,13,37,0.88)',
    borderWidth: 1,
    borderColor:
      'rgba(125,241,255,0.17)',
  },

  interactionDate: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  interactionValue: {
    marginTop: 3,
    color: '#E8FCFF',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  interactionReference: {
    marginTop: 7,
    color: 'rgba(220,232,255,0.60)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },

  interactionStats: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  interactionStat: {
    color:
      'rgba(220,232,255,0.64)',
    fontSize: 10,
    fontWeight: '700',
  },

  immersiveXAxisRow: {
    marginTop: 10,
    flexDirection: 'row',
    paddingLeft: 64,
  },

  immersiveXAxisCell: {
    flex: 1,
    alignItems: 'center',
  },

  immersiveXAxisLabel: {
    color: 'rgba(220,232,255,0.50)',
    fontSize: 10,
    fontWeight: '600',
  },

  immersiveFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
    zIndex: 2,
  },

  immersiveFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  immersiveFooterText: {
    marginLeft: 7,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default React.memo(RevenueAnalyticsV2);
