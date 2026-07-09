import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export type HealthTone = 'positive' | 'neutral' | 'negative';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface ExecutiveGreetingV2Props {
  /** Salon owner / operator's first name */
  ownerFirstName: string;
  /** Salon display name */
  salonName: string;
  /** Optional override — otherwise computed from the device's current time */
  greetingOverride?: string;
  businessHealth: {
    label: string; // e.g. "Excellent", "Strong", "Needs Attention"
    tone: HealthTone;
  };
  revenueToday: {
    amount: string; // pre-formatted, e.g. "$2,480"
    trendLabel: string; // e.g. "+12% vs yesterday"
    trendDirection: TrendDirection;
  };
  aiConfidence: {
    value: number; // 0–100
    label?: string; // e.g. "High accuracy today"
  };
  appointmentPulse: {
    completed: number;
    total: number;
    nextClientName?: string;
    nextTime?: string; // e.g. "2:30 PM"
  };
}

// Local palette — Royal Cosmos identity.
// Self-contained on purpose: swap for SalonFlowAI's existing theme/tokens
// import once this is wired into the real app, without changing the JSX below.
const colors = {
  surface: '#171938',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
  royalGlow: 'rgba(124,92,255,0.30)',
  gold: '#E8C97A',
  goldGlow: 'rgba(232,201,122,0.24)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  positive: '#3FCF8E',
  positiveSoft: 'rgba(63,207,142,0.14)',
  neutral: '#F2B84B',
  neutralSoft: 'rgba(242,184,75,0.14)',
  negative: '#F2617A',
  negativeSoft: 'rgba(242,97,122,0.14)',
} as const;

const healthToneMap: Record<HealthTone, { fg: string; bg: string }> = {
  positive: { fg: colors.positive, bg: colors.positiveSoft },
  neutral: { fg: colors.neutral, bg: colors.neutralSoft },
  negative: { fg: colors.negative, bg: colors.negativeSoft },
};

const trendColorMap: Record<TrendDirection, string> = {
  up: colors.positive,
  down: colors.negative,
  flat: colors.textTertiary,
};

function computeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * ExecutiveGreetingV2
 * Premium hero for Dashboard V2 — the first thing an owner sees. Surfaces
 * business health, today's revenue, AI confidence, and a live appointment
 * pulse at a glance. Presentation-only: all data arrives via props.
 */
function ExecutiveGreetingV2({
  ownerFirstName,
  salonName,
  greetingOverride,
  businessHealth,
  revenueToday,
  aiConfidence,
  appointmentPulse,
}: ExecutiveGreetingV2Props) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
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

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const health = healthToneMap[businessHealth.tone];
  const greeting = greetingOverride ?? computeGreeting();

  return (
    <View style={styles.card}>
      {/* Signature soft glow — layered translucent circles, zero dependencies */}
      <View pointerEvents="none" style={styles.glowWrap}>
        <View style={[styles.glowCircle, styles.glowOuter]} />
        <View style={[styles.glowCircle, styles.glowInner]} />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>{greeting.toUpperCase()}</Text>
        <View style={[styles.healthPill, { backgroundColor: health.bg }]}>
          <View style={[styles.healthDot, { backgroundColor: health.fg }]} />
          <Text style={[styles.healthLabel, { color: health.fg }]} numberOfLines={1}>
            {businessHealth.label}
          </Text>
        </View>
      </View>

      <Text style={styles.headline} numberOfLines={1}>
        {greeting}, {ownerFirstName}
      </Text>
      <Text style={styles.subline} numberOfLines={1}>
        Here's how {salonName} is performing right now.
      </Text>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        {/* Revenue today */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>REVENUE TODAY</Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {revenueToday.amount}
          </Text>
          <Text style={[styles.metricHelper, { color: trendColorMap[revenueToday.trendDirection] }]} numberOfLines={1}>
            {revenueToday.trendLabel}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        {/* AI confidence */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>AI CONFIDENCE</Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {Math.round(aiConfidence.value)}%
          </Text>
          {!!aiConfidence.label && (
            <Text style={styles.metricHelper} numberOfLines={1}>
              {aiConfidence.label}
            </Text>
          )}
        </View>

        <View style={styles.metricDivider} />

        {/* Appointment pulse */}
        <View style={styles.metricBlock}>
          <View style={styles.pulseLabelRow}>
            <View style={styles.pulseDotWrap}>
              <Animated.View
                style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
              />
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.metricLabel}>APPOINTMENT PULSE</Text>
          </View>
          <Text style={styles.metricValue} numberOfLines={1}>
            {appointmentPulse.completed}
            <Text style={styles.metricValueMuted}> / {appointmentPulse.total}</Text>
          </Text>
          {!!appointmentPulse.nextTime && (
            <Text style={styles.metricHelper} numberOfLines={1}>
              Next{appointmentPulse.nextClientName ? `: ${appointmentPulse.nextClientName} · ` : ': '}
              {appointmentPulse.nextTime}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  glowWrap: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOuter: {
    width: 220,
    height: 220,
    backgroundColor: colors.royalGlow,
    opacity: 0.35,
  },
  glowInner: {
    width: 130,
    height: 130,
    top: 45,
    left: 45,
    backgroundColor: colors.goldGlow,
    opacity: 0.45,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.royal,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  headline: {
    marginTop: 10,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  subline: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 18,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metricBlock: {
    flex: 1,
    minWidth: 0,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 14,
    alignSelf: 'stretch',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textTertiary,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  metricValueMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  metricHelper: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSecondary,
  },
  pulseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDotWrap: {
    width: 8,
    height: 8,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.positive,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positive,
  },
});

export default React.memo(ExecutiveGreetingV2);
