import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useDashboardTheme } from '../../../hooks/useDashboardTheme';
import type {
  ClientRetentionPulseModel,
} from '../../../lib/dashboard/finalEnrichment';

export type ClientRetentionPulseLabels = Readonly<{
  title: string;
  subtitle: string;
  live: string;
  returningRatio: string;
  riskScore: string;
  singleAppointment: string;
  repeatHistory: string;
  inactive: string;
  atRisk: string;
  highRisk: string;
  lost: string;
  overlapNote: string;
  loading: string;
  refreshing: string;
  unavailable: string;
  empty: string;
}>;

export type ClientRetentionPulseV2Props = Readonly<{
  model: ClientRetentionPulseModel;
  labels: ClientRetentionPulseLabels;
}>;

const colors = {
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#77799C',
  royal: '#7C5CFF',
  gold: '#E8C97A',
  green: '#3FCF8E',
  amber: '#F2B84B',
  red: '#F2617A',
  softBorder: 'rgba(255,255,255,0.07)',
  softSurface: 'rgba(255,255,255,0.035)',
} as const;

function displayNumber(value: number | null): string {
  return value === null ? '—' : String(value);
}

function displayPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`;
}

function ClientRetentionPulseV2({
  model,
  labels,
}: ClientRetentionPulseV2Props) {
  const { theme } = useDashboardTheme();

  const stateText =
    model.state === 'loading'
      ? labels.loading
      : model.state === 'unavailable'
        ? labels.unavailable
        : model.state === 'empty'
          ? labels.empty
          : null;

  return (
    <View
      accessible
      style={[
        styles.card,
        {
          backgroundColor: theme.palette.surface,
          borderColor: theme.palette.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>{labels.subtitle}</Text>
        </View>
        {model.state === 'available' || model.state === 'refreshing' ? (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>
              {model.state === 'available' ? labels.live : labels.refreshing}
            </Text>
          </View>
        ) : null}
      </View>

      {stateText ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{stateText}</Text>
        </View>
      ) : (
        <>
          <View style={styles.primaryRow}>
            <View style={styles.primaryMetric}>
              <Text style={styles.primaryLabel}>{labels.returningRatio}</Text>
              <Text style={styles.primaryValue}>
                {displayPercent(model.returningRatioPercent)}
              </Text>
            </View>
            <View style={styles.primaryDivider} />
            <View style={styles.primaryMetric}>
              <Text style={styles.primaryLabel}>{labels.riskScore}</Text>
              <Text style={styles.primaryValue}>
                {displayPercent(model.riskScore)}
              </Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <MetricChip
              label={labels.singleAppointment}
              value={displayNumber(model.singleAppointmentClients)}
              accent={colors.gold}
            />
            <MetricChip
              label={labels.repeatHistory}
              value={displayNumber(model.repeatHistoryClients)}
              accent={colors.green}
            />
            <MetricChip
              label={labels.inactive}
              value={displayNumber(model.inactiveClients)}
              accent={colors.amber}
            />
            <MetricChip
              label={labels.atRisk}
              value={displayNumber(model.atRiskClients)}
              accent={colors.amber}
            />
            <MetricChip
              label={labels.highRisk}
              value={displayNumber(model.highRiskClients)}
              accent={colors.red}
            />
            <MetricChip
              label={labels.lost}
              value={displayNumber(model.lostClients)}
              accent={colors.red}
            />
          </View>

          <Text style={styles.footnote}>{labels.overlapNote}</Text>
        </>
      )}
    </View>
  );
}

function MetricChip({
  label,
  value,
  accent,
}: Readonly<{
  label: string;
  value: string;
  accent: string;
}>) {
  return (
    <View style={styles.metricChip} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.metricDot, { backgroundColor: accent }]} />
      <View style={styles.metricCopy}>
        <Text style={styles.metricChipValue}>{value}</Text>
        <Text style={styles.metricChipLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.royal,
    marginRight: 6,
  },
  badgeText: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stateBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.softSurface,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryRow: {
    flexDirection: 'row',
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.softSurface,
  },
  primaryMetric: {
    flex: 1,
    minWidth: 0,
  },
  primaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.softBorder,
    marginHorizontal: 14,
  },
  primaryLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  primaryValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metricChip: {
    width: '48%',
    minWidth: 120,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: colors.softSurface,
  },
  metricDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 9,
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricChipValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  metricChipLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  footnote: {
    color: colors.textTertiary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 12,
  },
});

export default React.memo(ClientRetentionPulseV2);
