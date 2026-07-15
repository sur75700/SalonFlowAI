import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface BookingCommandHeaderV2Props {
  /** Pre-translated — this component never calls t() itself. */
  title: string;
  subtitle?: string;
  primaryActionLabel: string;
  onPressPrimaryAction: () => void;
  /**
   * Maps to the real "Booking Flow Connected" / "...Subtitle" i18n keys
   * (confirmed real, translated). Optional and only rendered when
   * provided — Tony decides the real trigger condition; this component
   * just displays it.
   */
  connectionStatusLabel?: string;
  connectionStatusSubtitle?: string;
}

const colors = {
  royal: '#7C5CFF',
  royalGlow: 'rgba(124,92,255,0.30)',
  gold: '#E8C97A',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  positive: '#3FCF8E',
  positiveSoft: 'rgba(63,207,142,0.14)',
} as const;

/**
 * BookingCommandHeaderV2 — presentation-only. No fetch, no business
 * logic. The connection-status pill is optional and purely reflects
 * whatever boolean/state Tony wires it to.
 */
function BookingCommandHeaderV2({
  title,
  subtitle,
  primaryActionLabel,
  onPressPrimaryAction,
  connectionStatusLabel,
  connectionStatusSubtitle,
}: BookingCommandHeaderV2Props) {
  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onPressPrimaryAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <Text style={styles.primaryBtnText} numberOfLines={1}>
            {primaryActionLabel}
          </Text>
        </Pressable>
      </View>

      {!!connectionStatusLabel && (
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <View style={styles.statusTextCol}>
            <Text style={styles.statusLabel} numberOfLines={1}>
              {connectionStatusLabel}
            </Text>
            {!!connectionStatusSubtitle && (
              <Text style={styles.statusSubtitle} numberOfLines={1}>
                {connectionStatusSubtitle}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(23,25,56,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.18)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: colors.royalGlow,
    opacity: 0.35,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  primaryBtn: {
    backgroundColor: colors.royal,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F6F5FB',
  },
  statusPill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.positiveSoft,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.positive,
    marginRight: 10,
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.positive,
  },
  statusSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default React.memo(BookingCommandHeaderV2);
