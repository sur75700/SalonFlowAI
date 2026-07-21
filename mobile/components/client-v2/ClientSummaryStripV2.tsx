import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native';

const theme = {
  color: {
    bgBase: '#0A0A12',
    surface: '#14141F',
    surfaceAlt: '#191927',
    surfaceRaised: '#1D1D2E',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    textPrimary: '#F2F2F8',
    textSecondary: '#A6A6BE',
    textTertiary: '#6C6C84',
    violet: '#8C7CFF',
    violetSoft: 'rgba(140,124,255,0.16)',
    blue: '#5C8CFF',
    blueSoft: 'rgba(92,140,255,0.16)',
    cyan: '#5FD3E8',
    cyanSoft: 'rgba(95,211,232,0.16)',
    gold: '#E8C275',
    goldSoft: 'rgba(232,194,117,0.18)',
    green: '#6FCF97',
    greenSoft: 'rgba(111,207,151,0.16)',
    red: '#E8748A',
    redSoft: 'rgba(232,116,138,0.16)',
  },
  radius: { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
};

export type KpiTone = 'neutral' | 'violet' | 'blue' | 'cyan' | 'gold' | 'green' | 'red';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface ClientSummaryKpi {
  id: string;
  label: string;
  value: string;
  helperText?: string;
  trendDirection?: TrendDirection;
  trendLabel?: string;
  tone?: KpiTone;
}

export interface ClientSummaryStripV2Props {
  kpis: ClientSummaryKpi[];
  loading?: boolean;
  skeletonCount?: number;
}

function toneColor(tone?: KpiTone) {
  switch (tone) {
    case 'violet':
      return theme.color.violet;
    case 'blue':
      return theme.color.blue;
    case 'cyan':
      return theme.color.cyan;
    case 'gold':
      return theme.color.gold;
    case 'green':
      return theme.color.green;
    case 'red':
      return theme.color.red;
    default:
      return theme.color.textSecondary;
  }
}

function trendColor(direction?: TrendDirection) {
  if (direction === 'up') return theme.color.green;
  if (direction === 'down') return theme.color.red;
  return theme.color.textTertiary;
}

function trendGlyph(direction?: TrendDirection) {
  const color = trendColor(direction);
  if (direction === 'up') {
    return (
      <View
        style={{
          width: 6,
          height: 6,
          borderLeftWidth: 1.5,
          borderTopWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    );
  }
  if (direction === 'down') {
    return (
      <View
        style={{
          width: 6,
          height: 6,
          borderLeftWidth: 1.5,
          borderTopWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: '225deg' }],
        }}
      />
    );
  }
  return <View style={{ width: 6, height: 1.5, backgroundColor: color }} />;
}

function KpiSkeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const block = (style: ViewStyle) => (
    <Animated.View style={[{ backgroundColor: theme.color.surfaceAlt, borderRadius: theme.radius.sm, opacity: pulse }, style]} />
  );

  return (
    <View style={styles.card}>
      {block({ width: '60%', height: 10, marginBottom: theme.space.md })}
      {block({ width: '40%', height: 22 })}
    </View>
  );
}

export default function ClientSummaryStripV2({ kpis, loading = false, skeletonCount = 5 }: ClientSummaryStripV2Props) {
  return (
    <View style={styles.strip} accessibilityRole="none">
      {loading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <View key={index} style={styles.cardWrapper}>
              <KpiSkeleton />
            </View>
          ))
        : kpis.map((kpi) => {
            const accent = toneColor(kpi.tone);
            return (
              <View key={kpi.id} style={styles.cardWrapper}>
                <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`${kpi.label}: ${kpi.value}`}>
                  <View style={[styles.accentBar, { backgroundColor: accent }]} />
                  <Text style={styles.label}>{kpi.label}</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {kpi.value}
                  </Text>
                  {!!kpi.trendLabel && (
                    <View style={styles.trendRow}>
                      {trendGlyph(kpi.trendDirection)}
                      <Text style={[styles.trendText, { color: trendColor(kpi.trendDirection) }]}>{kpi.trendLabel}</Text>
                    </View>
                  )}
                  {!!kpi.helperText && (
                    <Text style={styles.helperText} numberOfLines={1}>
                      {kpi.helperText}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.space.sm,
  },
  cardWrapper: {
    minWidth: 160,
    flexGrow: 1,
    flexBasis: '18%',
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.sm,
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space.lg,
    height: '100%',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
  },
  label: {
    color: theme.color.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: theme.space.sm,
  },
  value: {
    color: theme.color.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.space.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    color: theme.color.textTertiary,
    fontSize: 11,
    marginTop: theme.space.xs,
  },
});
