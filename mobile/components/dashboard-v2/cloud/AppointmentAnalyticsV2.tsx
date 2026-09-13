import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useDashboardTheme } from '../../../hooks/useDashboardTheme';
import type { CapacitySnapshotModel } from '../../../lib/dashboard/finalEnrichment';

export type AppointmentSegmentTone = 'scheduled' | 'completed' | 'cancelled' | 'other';

export interface AppointmentSegment {
  label: string; // e.g. "Completed"
  value: number; // e.g. 148
  tone: AppointmentSegmentTone;
}

export interface AppointmentPeriodOption {
  value: string;
  label: string;
}

export interface AppointmentAnalyticsV2Props {
  labels: {
    total: string;
    noData: string;
    emptyPeriod: string;
    selectPeriod: string;
  };
  title: string; // e.g. "Appointments"
  totalAppointments: number; // e.g. 248
  periodLabel: string; // e.g. "This Week"
  periodOptions?: readonly AppointmentPeriodOption[];
  selectedPeriod?: string;
  onPeriodChange?: (value: string) => void;
  segments: AppointmentSegment[];
  capacity?: CapacitySnapshotModel;
  capacityLabels?: {
    title: string;
    utilization: string;
    availableSlots: string;
    idleHours: string;
    analysisWindow: string;
    loading: string;
    refreshing: string;
    unavailable: string;
    locked: string;
  };
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  emptyTick: 'rgba(255,255,255,0.07)',
  gapTick: 'rgba(255,255,255,0.05)',
} as const;

const toneColorMap: Record<AppointmentSegmentTone, { fg: string; bg: string }> = {
  completed: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.12)' },
  scheduled: { fg: '#7C5CFF', bg: 'rgba(124,92,255,0.12)' },
  cancelled: { fg: '#F2617A', bg: 'rgba(242,97,122,0.12)' },
  other: { fg: '#E8C97A', bg: 'rgba(232,201,122,0.12)' },
};

// Radial ring built entirely from rotated View ticks — same technique as
// AICommandCenterV2's score dial, extended to render proportional,
// multi-tone segments (with a small gap tick between each) instead of a
// single fill percentage. No SVG.
const DIAL_SIZE = 128;
const DIAL_RADIUS = DIAL_SIZE / 2;
const TICK_COUNT = 60;
const TICK_WIDTH = 3;
const TICK_HEIGHT = 8;

function buildTickColors(segments: AppointmentSegment[], total: number): string[] {
  if (total <= 0 || segments.length === 0) {
    return Array(TICK_COUNT).fill(colors.emptyTick);
  }

  const raw = segments.map((s) => (Math.max(s.value, 0) / total) * TICK_COUNT);
  const floors = raw.map(Math.floor);
  const allocated = floors.reduce((a, b) => a + b, 0);
  const remainder = Math.max(0, Math.min(TICK_COUNT - allocated, TICK_COUNT));

  const fracOrder = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac);

  const counts = [...floors];
  for (let k = 0; k < remainder && k < fracOrder.length; k++) {
    counts[fracOrder[k].i] += 1;
  }

  const tickColors: string[] = [];
  segments.forEach((seg, idx) => {
    const segColor = toneColorMap[seg.tone].fg;
    const segCount = Math.max(0, counts[idx]);
    for (let t = 0; t < segCount; t++) {
      const isGap = segCount > 3 && t === segCount - 1;
      tickColors.push(isGap ? colors.gapTick : segColor);
    }
  });

  while (tickColors.length < TICK_COUNT) tickColors.push(colors.emptyTick);
  return tickColors.slice(0, TICK_COUNT);
}

function SegmentedDial({
  tickColors,
  centerValue,
  centerCaption,
}: {
  tickColors: string[];
  centerValue: string;
  centerCaption: string;
}) {
  return (
    <View style={styles.dialWrap}>
      {tickColors.map((color, i) => {
        const angle = (360 / TICK_COUNT) * i;
        return (
          <View
            key={i}
            style={[
              styles.tick,
              {
                backgroundColor: color,
                transform: [{ rotate: `${angle}deg` }, { translateY: -(DIAL_RADIUS - TICK_HEIGHT) }],
              },
            ]}
          />
        );
      })}
      <View style={styles.dialCenter} pointerEvents="none">
        <Text style={styles.dialValue} numberOfLines={1}>
          {centerValue}
        </Text>
        <Text style={styles.dialCaption} numberOfLines={1}>
          {centerCaption}
        </Text>
      </View>
    </View>
  );
}

/**
 * AppointmentAnalyticsV2 — segmented radial breakdown of appointment
 * status. Presentation-only, self-contained, no SVG/external packages.
 * Ring is proportional View ticks; legend shows label, count, and
 * percentage per segment; falls back to a calm empty state with no data.
 */
function AppointmentAnalyticsV2({
  labels,
  title,
  totalAppointments,
  periodLabel,
  periodOptions = [],
  selectedPeriod,
  onPeriodChange,
  segments,
  capacity,
  capacityLabels,
}: AppointmentAnalyticsV2Props) {
  const { theme } = useDashboardTheme();
  const [periodMenuOpen, setPeriodMenuOpen] =
    React.useState(false);

  const canSelectPeriod =
    periodOptions.length > 1 &&
    typeof onPeriodChange === 'function';

  const selectPeriod = (value: string) => {
    onPeriodChange?.(value);
    setPeriodMenuOpen(false);
  };

  const isEmpty = !segments || segments.length === 0 || totalAppointments <= 0;

  const tickColors = useMemo(
    () => buildTickColors(segments ?? [], totalAppointments),
    [segments, totalAppointments]
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.palette.surface,
          borderColor: theme.palette.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.selectPeriod.replace(
            '{period}',
            periodLabel
          )}
          disabled={!canSelectPeriod}
          onPress={() => setPeriodMenuOpen((open) => !open)}
          style={({ pressed }) => [
            styles.periodChip,
            {
              backgroundColor: theme.palette.surfaceRaised,
              borderColor: theme.palette.border,
            },
            pressed && canSelectPeriod && styles.periodChipPressed,
          ]}
        >
          <Text style={styles.periodChipText}>{periodLabel}</Text>
          <View style={styles.chevronDown} />
        </Pressable>
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

      <View style={styles.contentRow}>
        <SegmentedDial
          tickColors={tickColors}
          centerValue={isEmpty ? '—' : String(totalAppointments)}
          centerCaption={
            isEmpty ? labels.noData : labels.total
          }
        />

        <View style={styles.legendCol}>
          {isEmpty ? (
            <Text style={styles.emptyText}>
              {labels.emptyPeriod}
            </Text>
          ) : (
            segments.map((seg, i) => {
              const tone = toneColorMap[seg.tone];
              const pct = totalAppointments > 0 ? Math.round((seg.value / totalAppointments) * 100) : 0;
              return (
                <View key={`${seg.label}-${i}`} style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: tone.fg }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>
                      {seg.label}
                    </Text>
                  </View>
                  <Text style={styles.legendValue} numberOfLines={1}>
                    {seg.value}
                    <Text style={styles.legendPercent}> ({pct}%)</Text>
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      {capacity && capacityLabels && (
        <View style={styles.capacitySection}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityTitle}>{capacityLabels.title}</Text>
            {!!capacity.windowLabel && (
              <Text style={styles.capacityWindow}>
                {capacityLabels.analysisWindow}: {capacity.windowLabel}
              </Text>
            )}
          </View>

          {capacity.state === 'available' || capacity.state === 'refreshing' ? (
            <>
              {capacity.state === 'refreshing' && (
                <Text style={styles.capacityStateText}>{capacityLabels.refreshing}</Text>
              )}
              <View style={styles.capacityGrid}>
                <CapacityMetric
                  label={capacityLabels.utilization}
                  value={capacity.utilizationPercent === null ? '—' : `${Math.round(capacity.utilizationPercent * 10) / 10}%`}
                />
                <CapacityMetric
                  label={capacityLabels.availableSlots}
                  value={capacity.availableSlots === null ? '—' : String(capacity.availableSlots)}
                />
                <CapacityMetric
                  label={capacityLabels.idleHours}
                  value={capacity.idleHours === null ? '—' : `${Math.round(capacity.idleHours * 10) / 10}h`}
                />
              </View>
            </>
          ) : (
            <Text style={styles.capacityStateText}>
              {capacity.state === 'loading'
                ? capacityLabels.loading
                : capacity.state === 'not_entitled'
                  ? capacityLabels.locked
                  : capacityLabels.unavailable}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function CapacityMetric({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.capacityMetric} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.capacityMetricValue}>{value}</Text>
      <Text style={styles.capacityMetricLabel}>{label}</Text>
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
  contentRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialWrap: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
    top: DIAL_SIZE / 2 - TICK_HEIGHT / 2,
    left: DIAL_SIZE / 2 - TICK_WIDTH / 2,
    width: TICK_WIDTH,
    height: TICK_HEIGHT,
    borderRadius: TICK_WIDTH / 2,
  },
  dialCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  dialCaption: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  legendCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  capacitySection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  capacityTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  capacityWindow: {
    flexShrink: 1,
    color: colors.textTertiary,
    fontSize: 10,
    textAlign: 'right',
  },
  capacityStateText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  capacityGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capacityMetric: {
    flex: 1,
    minWidth: 92,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  capacityMetricValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  capacityMetricLabel: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
  },
});

export default React.memo(AppointmentAnalyticsV2);
