import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';

export type QuickActionTone = 'royal' | 'gold' | 'blue' | 'green' | 'red';

export interface QuickAction {
  id: string;
  label: string;
  /** No icon library dependency — pass whatever the host app already uses. Falls back to a monogram. */
  icon?: React.ReactNode;
  tone: QuickActionTone;
  helperText?: string;
  onPress?: () => void;
}

export interface QuickActionsV2Props {
  title: string;
  actions: QuickAction[];
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
} as const;

const toneColorMap: Record<QuickActionTone, { fg: string; bg: string; bgPressed: string }> = {
  royal: { fg: '#7C5CFF', bg: 'rgba(124,92,255,0.14)', bgPressed: 'rgba(124,92,255,0.26)' },
  gold: { fg: '#E8C97A', bg: 'rgba(232,201,122,0.14)', bgPressed: 'rgba(232,201,122,0.26)' },
  blue: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.14)', bgPressed: 'rgba(92,184,255,0.26)' },
  green: { fg: '#3FCF8E', bg: 'rgba(63,207,142,0.14)', bgPressed: 'rgba(63,207,142,0.26)' },
  red: { fg: '#F2617A', bg: 'rgba(242,97,122,0.14)', bgPressed: 'rgba(242,97,122,0.26)' },
};

// Self-contained responsive columns — no shared hook, just measured width.
function getColumnCount(width: number): number {
  if (width >= 900) return 6;
  if (width >= 680) return 5;
  if (width >= 460) return 4;
  return 3;
}

function ActionTile({ action }: { action: QuickAction }) {
  const tone = toneColorMap[action.tone];
  const monogram = action.label.trim().charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.helperText ? `${action.label}. ${action.helperText}` : action.label}
      hitSlop={2}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: pressed ? tone.bgPressed : colors.surfaceRaised, borderColor: pressed ? tone.fg : colors.border },
        pressed && styles.tilePressed,
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: tone.bg }]}>
        {action.icon ?? <Text style={[styles.monogram, { color: tone.fg }]}>{monogram}</Text>}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {action.label}
      </Text>
      {!!action.helperText && (
        <Text style={styles.helperText} numberOfLines={1}>
          {action.helperText}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * QuickActionsV2 — compact premium action grid. Presentation-only: each
 * tile calls the `onPress` it was given (or does nothing if omitted) —
 * no navigation, no business logic lives here. Self-contained, no
 * external packages; column count adapts to measured card width.
 */
function QuickActionsV2({ title, actions }: QuickActionsV2Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

  const columns = getColumnCount(containerWidth);
  const cellWidthPercent = 100 / columns;
  const isEmpty = !actions || actions.length === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.grid} onLayout={onLayout}>
        {isEmpty ? (
          <Text style={styles.emptyText}>No quick actions available right now.</Text>
        ) : (
          actions.map((action) => (
            <View key={action.id} style={[styles.cell, { width: `${cellWidthPercent}%` }]}>
              <ActionTile action={action} />
            </View>
          ))
        )}
      </View>
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    padding: 6,
  },
  tile: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    marginTop: 8,
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 15,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  helperText: {
    marginTop: 2,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});

export default React.memo(QuickActionsV2);
