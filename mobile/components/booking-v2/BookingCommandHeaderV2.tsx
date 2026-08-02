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
  surface: 'rgba(10, 13, 36, 0.94)',
  border: 'rgba(139, 114, 255, 0.26)',
  borderSoft: 'rgba(255,255,255,0.07)',
  royal: '#8B72FF',
  royalPressed: '#795FFF',
  royalGlow: 'rgba(139,114,255,0.28)',
  textPrimary: '#FBFAFF',
  textSecondary: '#B8BAD7',
  positive: '#47D69A',
  positiveSoft: 'rgba(71,214,154,0.12)',
  positiveBorder: 'rgba(71,214,154,0.24)',
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
    position: 'relative',
    borderRadius: 26,
    paddingVertical: 22,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#02030D',
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 10,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -82,
    right: -54,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: colors.royalGlow,
    opacity: 0.42,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 18,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.68,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  primaryBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.royal,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: colors.royal,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
  primaryBtnPressed: {
    backgroundColor: colors.royalPressed,
    opacity: 0.96,
    transform: [{ scale: 0.985 }],
  },
  primaryBtnText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    letterSpacing: 0.12,
    color: colors.textPrimary,
  },
  statusPill: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.positiveSoft,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: 11,
    borderRadius: 4,
    backgroundColor: colors.positive,
    shadowColor: colors.positive,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 0.1,
    color: colors.positive,
  },
  statusSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default React.memo(BookingCommandHeaderV2);
