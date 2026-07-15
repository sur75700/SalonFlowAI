import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BookingSummaryStat {
  label: string;
  value: string;
  tone?: 'royal' | 'gold' | 'blue' | 'green' | 'red';
}

export interface BookingSummaryStripV2Props {
  stats: BookingSummaryStat[];
}

const colors = {
  surface: '#171938',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textTertiary: '#6F7092',
} as const;

const toneColorMap = {
  royal: '#7C5CFF',
  gold: '#E8C97A',
  blue: '#5CB8FF',
  green: '#3FCF8E',
  red: '#F2617A',
} as const;

/**
 * BookingSummaryStripV2 — compact operational counters (Today / Total /
 * Upcoming in the current build). Deliberately not 3 full KPI cards: this
 * sits above the fold as a quick-read strip, not a competing hierarchy
 * against the booking stream itself.
 */
function BookingSummaryStripV2({ stats }: BookingSummaryStripV2Props) {
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
          <View key={stat.label} style={styles.cell}>
            <Text
              style={[styles.value, stat.tone && { color: toneColorMap[stat.tone] }]}
              numberOfLines={1}
            >
              {stat.value}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    gap: 12,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    minHeight: 82,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    display: 'none',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default React.memo(BookingSummaryStripV2);
