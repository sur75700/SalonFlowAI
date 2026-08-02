import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type TrendDirection = 'up' | 'down' | 'flat';
export type KPIAccent = 'gold' | 'royal' | 'blue' | 'green' | 'red';

export interface KPICardV2Props {
  label: string;
  value: string;
  trendLabel: string;
  trendDirection: TrendDirection;
  /**
   * No icon library dependency — pass whatever the host app already
   * renders icons with (emoji, a Text glyph, an existing icon component).
   * Falls back to a monogram built from `label` if omitted.
   */
  icon?: React.ReactNode;
  helperText: string;
  accent: KPIAccent;
  /**
   * Recent-trend values for the mini sparkline (oldest → newest).
   * Not in the original prop list but required to render the sparkline
   * requested below — omit it and the sparkline just doesn't render.
   */
  sparklineData?: number[];
  /** Tightens padding/type for dense 2-column phone grids */
  compact?: boolean;
}

const accentColorMap: Record<KPIAccent, { fg: string; bg: string }> = {
  gold: { fg: '#E8C97A', bg: 'rgba(232,201,122,0.14)' },
  royal: { fg: '#7C5CFF', bg: 'rgba(124,92,255,0.14)' },
  blue: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.14)' },
  green: { fg: '#3FCF8E', bg: 'rgba(63,207,142,0.14)' },
  red: { fg: '#F2617A', bg: 'rgba(242,97,122,0.14)' },
};

const trendColorMap: Record<TrendDirection, string> = {
  up: '#3FCF8E',
  down: '#F2617A',
  flat: '#6F7092',
};

const colors = {
  surface: '#171938',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
} as const;

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

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <View style={styles.sparklineRow}>
      {data.map((v, i) => {
        const heightPct = Math.max(((v - min) / range) * 100, 14);
        const isLast = i === data.length - 1;
        return (
          <View
            key={i}
            style={[
              styles.sparklineBar,
              {
                height: `${heightPct}%`,
                backgroundColor: color,
                opacity: isLast ? 1 : 0.35 + (i / data.length) * 0.35,
                marginRight: isLast ? 0 : 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * KPICardV2 — compact, phone-first KPI tile for the Dashboard V2
 * KPI Command Center. Self-contained: no icon library, no SVG, no
 * external packages. Sparkline is a plain row of `View` bars.
 */
function KPICardV2({
  label,
  value,
  trendLabel,
  trendDirection,
  icon,
  helperText,
  accent,
  sparklineData,
  compact = false,
}: KPICardV2Props) {
  const accentColor = accentColorMap[accent];
  const monogram = label.trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.card,
        { padding: compact ? 12 : 16 },
        { borderLeftColor: accentColor.fg, borderLeftWidth: 3 },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: accentColor.bg }, compact && styles.iconChipCompact]}>
          {icon ?? (
            <Text style={[styles.monogram, { color: accentColor.fg }]}>{monogram}</Text>
          )}
        </View>
        <View style={styles.trendPill}>
          <TrendIndicator direction={trendDirection} />
          <Text style={[styles.trendLabel, { color: trendColorMap[trendDirection] }]} numberOfLines={1}>
            {trendLabel}
          </Text>
        </View>
      </View>

      <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
        {label}
      </Text>

      <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
        {value}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.helperText} numberOfLines={1}>
          {helperText}
        </Text>
        {!!sparklineData && sparklineData.length > 1 && (
          <MiniSparkline data={sparklineData} color={accentColor.fg} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipCompact: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  monogram: {
    fontSize: 13,
    fontWeight: '700',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  label: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  labelCompact: {
    marginTop: 8,
    fontSize: 11,
  },
  value: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  valueCompact: {
    fontSize: 18,
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  helperText: {
    flex: 1,
    fontSize: 11,
    color: colors.textTertiary,
    marginRight: 8,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 22,
    width: 48,
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 3,
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

export default React.memo(KPICardV2);
