import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export type InsightTone = 'positive' | 'neutral' | 'warning' | 'danger';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface AIInsight {
  title: string;
  description: string;
  tone: InsightTone;
}

export interface FocusItem {
  time?: string; // e.g. "2:30 PM"
  label: string; // e.g. "Confirm Sarah's color appointment"
  detail?: string; // e.g. "High no-show risk based on booking history"
  tone?: InsightTone;
}

export interface ForecastSeriesPoint {
  label: string; // e.g. "Mon"
  value: number;
}

export interface AICommandCenterV2Props {
  healthLabel: string;
  aiScore: number; // 0–100
  confidenceLabel: string;
  insights: AIInsight[];
  recommendations: string[];
  /**
   * Not in the original prop list but required to render the requested
   * Today's Focus section — omit and it shows a calm empty state.
   */
  todaysFocus: FocusItem[];
  /**
   * Not in the original prop list but required to render the requested
   * Forecast section.
   */
  forecast: {
    headline: string;
    helperText?: string;
    trendLabel?: string;
    trendDirection?: TrendDirection;
    series: ForecastSeriesPoint[];
  };
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
  gold: '#E8C97A',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  positive: '#3FCF8E',
  warning: '#F2B84B',
  danger: '#F2617A',
  neutralAccent: '#5CB8FF',
} as const;

const toneColorMap: Record<InsightTone, { fg: string; bg: string }> = {
  positive: { fg: colors.positive, bg: 'rgba(63,207,142,0.12)' },
  neutral: { fg: colors.neutralAccent, bg: 'rgba(92,184,255,0.12)' },
  warning: { fg: colors.warning, bg: 'rgba(242,184,75,0.12)' },
  danger: { fg: colors.danger, bg: 'rgba(242,97,122,0.12)' },
};

const trendColorMap: Record<TrendDirection, string> = {
  up: colors.positive,
  down: colors.danger,
  flat: colors.textTertiary,
};

function getScoreTone(score: number): { fg: string; bg: string } {
  if (score >= 80) return { fg: colors.gold, bg: 'rgba(232,201,122,0.14)' };
  if (score >= 60) return { fg: colors.royal, bg: 'rgba(124,92,255,0.14)' };
  return { fg: colors.warning, bg: 'rgba(242,184,75,0.14)' };
}

// Radial "instrument dial" built entirely from rotated View ticks — no SVG.
const DIAL_SIZE = 136;
const DIAL_RADIUS = DIAL_SIZE / 2;
const TICK_COUNT = 32;
const TICK_WIDTH = 3;
const TICK_HEIGHT = 10;

function ScoreDial({ score, tone }: { score: number; tone: string }) {
  const filledTicks = Math.round((Math.max(0, Math.min(100, score)) / 100) * TICK_COUNT);

  return (
    <View style={styles.dialWrap}>
      {Array.from({ length: TICK_COUNT }).map((_, i) => {
        const angle = (360 / TICK_COUNT) * i;
        const filled = i < filledTicks;
        return (
          <View
            key={i}
            style={[
              styles.tick,
              {
                backgroundColor: filled ? tone : 'rgba(255,255,255,0.08)',
                transform: [{ rotate: `${angle}deg` }, { translateY: -(DIAL_RADIUS - TICK_HEIGHT) }],
              },
            ]}
          />
        );
      })}
      <View style={styles.dialCenter} pointerEvents="none">
        <Text style={styles.dialValue}>{Math.round(score)}</Text>
        <Text style={styles.dialOutOf}>/ 100</Text>
      </View>
    </View>
  );
}

function ForecastBars({ series, color }: { series: ForecastSeriesPoint[]; color: string }) {
  if (!series || series.length < 2) return null;
  const values = series.map((s) => s.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <View style={styles.forecastChart}>
      {series.map((point, i) => {
        const heightPct = Math.max(((point.value - min) / range) * 100, 10);
        const isLast = i === series.length - 1;
        return (
          <View key={point.label} style={styles.forecastColumn}>
            <View style={styles.forecastTrack}>
              <View
                style={[
                  styles.forecastFill,
                  { height: `${heightPct}%`, backgroundColor: isLast ? color : 'rgba(124,92,255,0.30)' },
                ]}
              />
            </View>
            <Text style={styles.forecastColumnLabel} numberOfLines={1}>
              {point.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * AICommandCenterV2 — the signature "brain" of SalonFlowAI. Presentation
 * only: every number, label, and list arrives via props. Self-contained,
 * no external packages, no SVG — the score dial is built from rotated
 * View ticks and the forecast chart from plain bars.
 */
function AICommandCenterV2({
  healthLabel,
  aiScore,
  confidenceLabel,
  insights,
  recommendations,
  todaysFocus,
  forecast,
}: AICommandCenterV2Props) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const scoreTone = getScoreTone(aiScore);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.pulseDotWrap}>
            <Animated.View
              style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
            />
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.eyebrow}>AI COMMAND CENTER</Text>
        </View>
        <View style={[styles.healthPill, { backgroundColor: scoreTone.bg }]}>
          <Text style={[styles.healthLabel, { color: scoreTone.fg }]} numberOfLines={1}>
            {healthLabel}
          </Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <ScoreDial score={aiScore} tone={scoreTone.fg} />
        <View style={styles.scoreTextCol}>
          <Text style={styles.scoreHeadline}>AI Score</Text>
          <Text style={styles.confidenceLabel}>{confidenceLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Today's Focus */}
      <Text style={styles.sectionEyebrow}>TODAY'S FOCUS</Text>
      {todaysFocus.length === 0 ? (
        <Text style={styles.emptyText}>Nothing urgent — the day looks clear.</Text>
      ) : (
        <View style={styles.focusList}>
          {todaysFocus.map((item, i) => {
            const tone = toneColorMap[item.tone ?? 'neutral'];
            return (
              <View key={i} style={styles.focusRow}>
                <View style={[styles.focusDot, { backgroundColor: tone.fg }]} />
                <View style={styles.focusTextCol}>
                  <View style={styles.focusTopLine}>
                    {!!item.time && <Text style={styles.focusTime}>{item.time}</Text>}
                    <Text style={styles.focusLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                  {!!item.detail && (
                    <Text style={styles.focusDetail} numberOfLines={2}>
                      {item.detail}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.divider} />

      {/* Forecast */}
      <Text style={styles.sectionEyebrow}>FORECAST</Text>
      <View style={styles.forecastHeaderRow}>
        <Text style={styles.forecastHeadline} numberOfLines={2}>
          {forecast.headline}
        </Text>
        {!!forecast.trendLabel && (
          <Text style={[styles.forecastTrend, { color: trendColorMap[forecast.trendDirection ?? 'flat'] }]}>
            {forecast.trendLabel}
          </Text>
        )}
      </View>
      {!!forecast.helperText && <Text style={styles.forecastHelper}>{forecast.helperText}</Text>}
      <ForecastBars series={forecast.series} color={scoreTone.fg} />

      <View style={styles.divider} />

      {/* Insights */}
      <Text style={styles.sectionEyebrow}>INSIGHTS</Text>
      {insights.length === 0 ? (
        <Text style={styles.emptyText}>No new insights right now.</Text>
      ) : (
        <View style={styles.insightList}>
          {insights.map((insight, i) => {
            const tone = toneColorMap[insight.tone];
            return (
              <View key={i} style={[styles.insightCard, { backgroundColor: tone.bg }]}>
                <View style={[styles.insightBar, { backgroundColor: tone.fg }]} />
                <View style={styles.insightTextCol}>
                  <Text style={styles.insightTitle} numberOfLines={1}>
                    {insight.title}
                  </Text>
                  <Text style={styles.insightDescription} numberOfLines={2}>
                    {insight.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.divider} />

      {/* Recommendations */}
      <Text style={styles.sectionEyebrow}>RECOMMENDATIONS</Text>
      {recommendations.length === 0 ? (
        <Text style={styles.emptyText}>You're all caught up.</Text>
      ) : (
        <View style={styles.recommendationList}>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.recommendationRow}>
              <View style={styles.diamondBullet} />
              <Text style={styles.recommendationText} numberOfLines={2}>
                {rec}
              </Text>
            </View>
          ))}
        </View>
      )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDotWrap: {
    width: 8,
    height: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  healthPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreRow: {
    marginTop: 18,
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
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  dialOutOf: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  scoreTextCol: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  scoreHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confidenceLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: colors.textTertiary,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  focusList: {},
  focusRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  focusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  focusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  focusTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
    marginRight: 8,
  },
  focusLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  focusDetail: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  forecastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  forecastHeadline: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    color: colors.textPrimary,
    marginRight: 10,
  },
  forecastTrend: {
    fontSize: 12,
    fontWeight: '700',
  },
  forecastHelper: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  forecastChart: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  forecastColumn: {
    flex: 1,
    alignItems: 'center',
  },
  forecastTrack: {
    width: '60%',
    height: 64,
    justifyContent: 'flex-end',
  },
  forecastFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  forecastColumnLabel: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textTertiary,
  },
  insightList: {},
  insightCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  insightBar: {
    width: 3,
    borderRadius: 2,
    marginRight: 10,
  },
  insightTextCol: {
    flex: 1,
    minWidth: 0,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  insightDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  recommendationList: {},
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  diamondBullet: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    marginTop: 6,
    marginRight: 10,
    transform: [{ rotate: '45deg' }],
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});

export default React.memo(AICommandCenterV2);


