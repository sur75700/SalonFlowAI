import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';

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

export type ClientFilterKey = 'all' | 'active' | 'new' | 'returning' | 'vip' | 'inactive';

export interface ClientFilterOption {
  key: ClientFilterKey;
  label: string;
  count?: number;
}

export interface ClientSearchFiltersV2Labels {
  searchPlaceholder: string;
  searchAccessibilityLabel: string;
  clearSearchAccessibilityLabel: string;
  filterGroupAccessibilityLabel: string;
}

export const DEFAULT_CLIENT_SEARCH_FILTERS_LABELS: ClientSearchFiltersV2Labels = {
  searchPlaceholder: 'Search by name, phone, or email',
  searchAccessibilityLabel: 'Search clients',
  clearSearchAccessibilityLabel: 'Clear search',
  filterGroupAccessibilityLabel: 'Filter clients by status',
};

export interface ClientSearchFiltersV2Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: ClientFilterOption[];
  activeFilterKey: ClientFilterKey;
  onFilterChange: (key: ClientFilterKey) => void;
  disabled?: boolean;
  labels?: Partial<ClientSearchFiltersV2Labels>;
}

function SearchGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.6, borderColor: color }} />
      <View
        style={{
          position: 'absolute',
          width: 1.6,
          height: 6,
          backgroundColor: color,
          bottom: 0,
          right: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 14, height: 14 }}>
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 0,
          width: 14,
          height: 1.6,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 0,
          width: 14,
          height: 1.6,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

export default function ClientSearchFiltersV2({
  searchValue,
  onSearchChange,
  filters,
  activeFilterKey,
  onFilterChange,
  disabled = false,
  labels,
}: ClientSearchFiltersV2Props) {
  const t: ClientSearchFiltersV2Labels = { ...DEFAULT_CLIENT_SEARCH_FILTERS_LABELS, ...labels };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.searchField}>
        <SearchGlyph color={theme.color.textTertiary} />
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={theme.color.textTertiary}
          editable={!disabled}
          style={styles.searchInput}
          accessibilityLabel={t.searchAccessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchValue.length > 0 && (
          <Pressable
            onPress={() => onSearchChange('')}
            disabled={disabled}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.clearSearchAccessibilityLabel}
            style={styles.clearButton}
          >
            <CloseGlyph color={theme.color.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        accessibilityRole="tablist"
        accessibilityLabel={t.filterGroupAccessibilityLabel}
      >
        {filters.map((filter) => {
          const active = filter.key === activeFilterKey;
          return (
            <Pressable
              key={filter.key}
              onPress={() => !disabled && onFilterChange(filter.key)}
              disabled={disabled}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={filter.label}
              style={({ pressed }: { pressed: boolean }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && !disabled && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.label}
                {typeof filter.count === 'number' ? ` (${filter.count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.space.md,
  },
  disabled: {
    opacity: 0.5,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.lg,
    minHeight: 46,
    gap: theme.space.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.color.textPrimary,
    fontSize: 14,
    paddingVertical: theme.space.sm,
  },
  clearButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -theme.space.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.space.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: theme.color.violetSoft,
    borderColor: theme.color.violet,
  },
  chipPressed: {
    backgroundColor: theme.color.surfaceAlt,
  },
  chipText: {
    color: theme.color.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.color.violet,
  },
});
