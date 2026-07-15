import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

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
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
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
  return (
    <View style={styles.card}>
      {onSearchChange !== undefined && (
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
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
              style={[styles.segment, active && styles.segmentActive]}
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
