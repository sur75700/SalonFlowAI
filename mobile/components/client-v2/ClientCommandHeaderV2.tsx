import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, useWindowDimensions } from 'react-native';

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

export type LiveStatusTone = 'active' | 'idle' | 'offline';

export interface ClientCommandHeaderV2Props {
  overline?: string;
  title: string;
  subtitle?: string;
  liveStatusLabel?: string;
  liveStatusTone?: LiveStatusTone;
  createClientLabel?: string;
  onCreateClient?: () => void;
  importLabel?: string;
  onImport?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function liveDotColor(tone: LiveStatusTone) {
  if (tone === 'active') return theme.color.green;
  if (tone === 'idle') return theme.color.gold;
  return theme.color.textTertiary;
}

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        opacity: pulse,
      }}
    />
  );
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 12, height: 12 }}>
      <View style={{ position: 'absolute', top: 5, left: 0, width: 12, height: 2, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: 0, left: 5, width: 2, height: 12, backgroundColor: color }} />
    </View>
  );
}

export default function ClientCommandHeaderV2({
  overline,
  title,
  subtitle,
  liveStatusLabel,
  liveStatusTone = 'active',
  createClientLabel = 'Add client',
  onCreateClient,
  importLabel = 'Import',
  onImport,
  disabled = false,
  loading = false,
}: ClientCommandHeaderV2Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const interactive = !disabled && !loading;

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={styles.titleBlock}>
        {!!overline && <Text style={styles.overline}>{overline}</Text>}
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={[styles.actions, isDesktop && styles.actionsDesktop]}>
        {!!liveStatusLabel && (
          <View style={styles.liveBadge} accessibilityRole="text" accessibilityLabel={liveStatusLabel}>
            <PulsingDot color={liveDotColor(liveStatusTone)} />
            <Text style={styles.liveBadgeText}>{liveStatusLabel}</Text>
          </View>
        )}

        {!!onImport && (
          <Pressable
            onPress={onImport}
            disabled={!interactive}
            accessibilityRole="button"
            accessibilityLabel={importLabel}
            accessibilityState={{ disabled: !interactive }}
            style={({ pressed }: { pressed: boolean }) => [
              styles.secondaryButton,
              pressed && interactive && styles.secondaryButtonPressed,
              !interactive && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{importLabel}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onCreateClient}
          disabled={!interactive}
          accessibilityRole="button"
          accessibilityLabel={createClientLabel}
          accessibilityState={{ disabled: !interactive }}
          style={({ pressed }: { pressed: boolean }) => [
            styles.primaryButton,
            pressed && interactive && styles.primaryButtonPressed,
            !interactive && styles.buttonDisabled,
          ]}
        >
          <PlusGlyph color={theme.color.bgBase} />
          <Text style={styles.primaryButtonText}>{createClientLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.space.lg,
  },
  containerDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flexShrink: 1,
  },
  overline: {
    color: theme.color.violet,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: theme.space.sm,
  },
  title: {
    color: theme.color.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: theme.color.textSecondary,
    fontSize: 14,
    marginTop: theme.space.xs,
    maxWidth: 480,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.space.md,
  },
  actionsDesktop: {
    justifyContent: 'flex-end',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.md,
    minHeight: 36,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
  },
  liveBadgeText: {
    color: theme.color.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: theme.color.surfaceAlt,
  },
  secondaryButtonText: {
    color: theme.color.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: 44,
    paddingHorizontal: theme.space.xl,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.violet,
  },
  primaryButtonPressed: {
    backgroundColor: '#7A69EF',
  },
  primaryButtonText: {
    color: theme.color.bgBase,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
