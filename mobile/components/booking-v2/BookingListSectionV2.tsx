import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import BookingCardV3, { BookingCardV2Props, BookingCardLayout } from './BookingCardV3';

export interface BookingListSectionV2Props {
  /** Pre-translated — this component never calls t() itself. */
  title: string;
  subtitle?: string;
  items: (BookingCardV2Props & { id: string })[];
  loading?: boolean;
  error?: string;
  emptyLabel: string;
  /** 'row' on desktop (details left, status+actions right), 'stacked' on mobile. Defaults to 'stacked'. */
  cardLayout?: BookingCardLayout;
}

const colors = {
  surface: 'rgba(23,25,56,0.88)',
  border: 'rgba(124,92,255,0.16)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  danger: '#F2617A',
  dangerSoft: 'rgba(242,97,122,0.12)',
} as const;

/**
 * BookingListSectionV2 — presentation-only section wrapper. Renders
 * loading / error / empty / populated states from props only; it never
 * fetches or decides *why* a state applies, only how it looks. Registry
 * density (gap between cards) is kept tight and consistent so a long
 * list still reads as scannable, not as spaced-out cards floating in
 * empty space.
 */
function BookingListSectionV2({
  title,
  subtitle,
  items,
  loading,
  error,
  emptyLabel,
  cardLayout = 'stacked',
}: BookingListSectionV2Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.textSecondary} />
          </View>
        ) : error ? (
          <View style={[styles.centerState, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.cardWrap, index === items.length - 1 && styles.cardWrapLast]}
            >
              <BookingCardV3 {...item} layout={item.layout ?? cardLayout} />
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  body: {
    width: '100%',
    marginTop: 16,
  },
  cardWrap: {
    width: '100%',
    marginBottom: 14,
  },
  cardWrapLast: {
    marginBottom: 0,
  },
  centerState: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'transparent',
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});

export default React.memo(BookingListSectionV2);
