import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface RevenueSeriesPoint {
  label: string; // x-axis tick label, e.g. "May 6"
  value: number;
}

export interface RevenueAnalyticsV2Props {
  title?: string; // default "Revenue Overview"
  periodLabel: string; // e.g. "This Month"
  totalValue: string; // pre-formatted, e.g. "$124,580"
  trendLabel: string; // pre-formatted, e.g. "+18.6%"
  trendDirection: TrendDirection;
  currentSeries: RevenueSeriesPoint[];
  /** Ideally same length/order as currentSeries so the two lines align */
  comparisonSeries?: RevenueSeriesPoint[];
  currentSeriesLabel?: string; // default "This Month"
  comparisonSeriesLabel?: string; // default "Last Month"
  /** Plot height in px — width is always measured/fluid */
  height?: number;
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
  royalFillStrong: 'rgba(124,92,255,0.22)',
  royalFillSoft: 'rgba(124,92,255,0.08)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  positive: '#3FCF8E',
  danger: '#F2617A',
  gridLine: 'rgba(255,255,255,0.06)',
} as const;

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

function formatAxisValue(value: number): string {
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

function sampleY(scaledPoints: ScaledPoint[], sampleX: number, chartWidth: number): number {
  const n = scaledPoints.length;
  if (n === 0) return 0;
  if (n === 1) return scaledPoints[0].y;
  const t = (sampleX / chartWidth) * (n - 1);
  const i = Math.max(0, Math.min(n - 2, Math.floor(t)));
  const frac = t - i;
  const y0 = scaledPoints[i].y;
  const y1 = scaledPoints[i + 1].y;
  return y0 + (y1 - y0) * frac;
}

const AREA_COLUMNS = 56;

// Area fill sampled independently of point count — always renders as a
// smooth continuous band, built from plain Views (no SVG, no gradients).
function AreaFill({
  scaledPoints,
  chartWidth,
  chartHeight,
}: {
  scaledPoints: ScaledPoint[];
  chartWidth: number;
  chartHeight: number;
}) {
  if (chartWidth === 0 || scaledPoints.length < 2) return null;
  const colWidth = chartWidth / AREA_COLUMNS;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: AREA_COLUMNS }).map((_, c) => {
        const sampleX = c * colWidth + colWidth / 2;
        const y = sampleY(scaledPoints, sampleX, chartWidth);
        const fillHeight = Math.max(chartHeight - y, 0);
        const fadeHeight = fillHeight * 0.4;
        return (
          <React.Fragment key={c}>
            <View
              style={{
                position: 'absolute',
                left: c * colWidth,
                top: y,
                width: colWidth + 0.6,
                height: fillHeight,
                backgroundColor: colors.royalFillSoft,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: c * colWidth,
                top: chartHeight - fadeHeight,
                width: colWidth + 0.6,
                height: fadeHeight,
                backgroundColor: colors.royalFillStrong,
              }}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
}

// Line built from rotated Views connecting each point — solid for the
// current series, sampled short dashes for the comparison series.
function LineSegments({
  scaledPoints,
  color,
  dashed,
}: {
  scaledPoints: ScaledPoint[];
  color: string;
  dashed?: boolean;
}) {
  const segments: React.ReactNode[] = [];

  for (let i = 0; i < scaledPoints.length - 1; i++) {
    const p0 = scaledPoints[i];
    const p1 = scaledPoints[i + 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (!dashed) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      segments.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            left: midX - length / 2,
            top: midY - 1.25,
            width: length,
            height: 2.5,
            borderRadius: 1.25,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      );
    } else {
      const dashLength = 5;
      const gapLength = 4;
      const segmentLength = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const step = dashLength + gapLength;
      const dashCount = Math.max(1, Math.floor(segmentLength / step));
      for (let d = 0; d < dashCount; d++) {
        const startT = (d * step) / segmentLength;
        const endT = Math.min((d * step + dashLength) / segmentLength, 1);
        const startX = p0.x + dx * startT;
        const startY = p0.y + dy * startT;
        const endX = p0.x + dx * endT;
        const endY = p0.y + dy * endT;
        const dashDx = endX - startX;
        const dashDy = endY - startY;
        const dashLen = Math.sqrt(dashDx * dashDx + dashDy * dashDy);
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        segments.push(
          <View
            key={`${i}-${d}`}
            style={{
              position: 'absolute',
              left: midX - dashLen / 2,
              top: midY - 1,
              width: dashLen,
              height: 2,
              borderRadius: 1,
              backgroundColor: color,
              opacity: 0.6,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      }
    }
  }

  return <>{segments}</>;
}

/**
 * RevenueAnalyticsV2 — premium "Revenue Overview" card. Presentation-only:
 * every number and data point arrives via props. The chart is built
 * entirely from plain Views (rotated line segments + sampled area-fill
 * columns) — no SVG, no external packages.
 */
function RevenueAnalyticsV2({
  title = 'Revenue Overview',
  periodLabel,
  totalValue,
  trendLabel,
  trendDirection,
  currentSeries,
  comparisonSeries,
  currentSeriesLabel = 'This Month',
  comparisonSeriesLabel = 'Last Month',
  height = 200,
}: RevenueAnalyticsV2Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const onChartLayout = (e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width);

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

  const yAxisSteps = [1, 0.75, 0.5, 0.25, 0];
  const lastPoint = currentScaled[currentScaled.length - 1];
  const labelStep = currentSeries.length > 6 ? Math.ceil(currentSeries.length / 5) : 1;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.periodChip}>
          <Text style={styles.periodChipText}>{periodLabel}</Text>
          <View style={styles.chevronDown} />
        </View>
      </View>

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
            <View style={[styles.legendDot, { backgroundColor: colors.royal }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {currentSeriesLabel}
            </Text>
          </View>
          {!!comparisonSeries && (
            <View style={styles.legendRow}>
              <View style={styles.legendDashDot} />
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
              {formatAxisValue(min + (max - min) * step)}
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
            <View style={{ width: chartWidth, height }}>
              <AreaFill scaledPoints={currentScaled} chartWidth={chartWidth} chartHeight={height} />
              {comparisonScaled.length > 1 && (
                <LineSegments scaledPoints={comparisonScaled} color={colors.textTertiary} dashed />
              )}
              <LineSegments scaledPoints={currentScaled} color={colors.royal} />
              {!!lastPoint && (
                <View style={styles.pointLayer} pointerEvents="none">
                  <View style={[styles.pointOuterRing, { left: lastPoint.x - 7, top: lastPoint.y - 7 }]} />
                  <View style={[styles.pointDot, { left: lastPoint.x - 4, top: lastPoint.y - 4 }]} />
                </View>
              )}
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
});

export default React.memo(RevenueAnalyticsV2);
