import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { useDashboardTheme } from '../../hooks/useDashboardTheme';

/** Only the 3 confirmed-real statuses, plus 'all' — matches BookingCardV2. */
export type BookingFilterValue = 'all' | 'scheduled' | 'completed' | 'cancelled';

export interface BookingFilterOption {
  value: BookingFilterValue;
  /** Pre-translated label — this component never calls t() itself. */
  label: string;
}

export interface BookingStatusFilterV2Props {
  options: BookingFilterOption[];
  value: BookingFilterValue;
  onChange: (value: BookingFilterValue) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const colors = {
  surface: 'rgba(8, 12, 31, 0.82)',
  surfaceRaised: 'rgba(15, 20, 48, 0.90)',
  border: 'rgba(150, 129, 255, 0.25)',
  royal: '#8B72FF',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
} as const;

/**
 * BookingStatusFilterV2 — presentation-only segmented filter + optional
 * search. `onChange`/`onSearchChange` are the only side effects; this
 * component holds no state of its own (fully controlled).
 */
function BookingStatusFilterV2({
  options,
  value,
  onChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: BookingStatusFilterV2Props) {
  const { selectedThemeId, theme: dashboardTheme } = useDashboardTheme();
  const isBurgundyCosmos = selectedThemeId === "burgundy_cosmos";
  const burgundySurfaceStyle = isBurgundyCosmos
    ? {
        backgroundColor: dashboardTheme.palette.surface,
        borderColor: dashboardTheme.palette.borderStrong,
        shadowColor: "#000000",
        shadowOpacity: 0.26,
      }
    : undefined;
  const burgundyRaisedStyle = isBurgundyCosmos
    ? {
        backgroundColor: dashboardTheme.palette.surfaceRaised,
        borderColor: dashboardTheme.palette.border,
      }
    : undefined;

  return (
    <View style={[styles.card, burgundySurfaceStyle]}>
      {onSearchChange !== undefined && (
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, burgundyRaisedStyle]}
        />
      )}

      <View style={styles.segmentRow}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segment, !active && burgundyRaisedStyle, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  segment: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.royal,
    borderColor: colors.royal,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#F6F5FB',
    fontWeight: '700',
  },
});

export default React.memo(BookingStatusFilterV2);
