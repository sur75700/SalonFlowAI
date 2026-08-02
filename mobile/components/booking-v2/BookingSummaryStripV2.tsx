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
  surface: 'rgba(10, 13, 36, 0.94)',
  surfaceTop: 'rgba(24, 28, 66, 0.96)',
  border: 'rgba(139, 114, 255, 0.30)',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#FBFAFF',
  textSecondary: '#B7B9D4',
  textTertiary: '#8589AB',
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
      {stats.map((stat) => {
        const tone = stat.tone ? toneColorMap[stat.tone] : toneColorMap.royal;

        return (
          <View key={stat.label} style={styles.cell}>
            <View style={[styles.accentLine, { backgroundColor: tone }]} />

            <View style={styles.valueRow}>
              <View style={[styles.signalDot, { backgroundColor: tone }]} />

              <Text style={[styles.value, { color: tone }]} numberOfLines={1}>
                {stat.value}
              </Text>
            </View>

            <Text style={styles.label} numberOfLines={1}>
              {stat.label}
            </Text>

            <View style={styles.footerLine} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    gap: 14,
  },

  cell: {
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#02030D',
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 10,
  },

  accentLine: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 2,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    opacity: 0.9,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  signalDot: {
    width: 8,
    height: 8,
    marginRight: 9,
    borderRadius: 4,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  value: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.9,
    color: colors.textPrimary,
  },

  label: {
    marginTop: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  footerLine: {
    width: 34,
    height: 1,
    marginTop: 13,
    backgroundColor: colors.borderSoft,
  },
});

export default React.memo(BookingSummaryStripV2);
