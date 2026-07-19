import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Only the 3 statuses confirmed real in the backend model
 * (AppointmentStatus = "scheduled" | "completed" | "cancelled").
 * Visual capacity for confirmed/no-show/pending stays a documented
 * comment, never a runtime type, per standing instruction.
 */
export type BookingStatus = 'scheduled' | 'completed' | 'cancelled';

/** 'stacked' = mobile (time+status top, client/service center, actions bottom). 'row' = desktop (details left, status+actions right). */
export type BookingCardLayout = 'stacked' | 'row';

export interface BookingCardV2Props {
  /** Pre-formatted display strings only — no Date objects, no formatting logic here. */
  dateLabel?: string;
  time: string;
  endTime?: string;
  /** Missing real value → fallback label renders instead (pre-translated), never a blank line. */
  clientName?: string;
  clientFallbackLabel?: string;
  serviceName?: string;
  serviceFallbackLabel?: string;
  status: BookingStatus;
  /** Pre-translated display label — this component never calls t() itself. */
  statusLabel: string;
  staffName?: string;
  /** Pre-formatted — derive from starts_at/ends_at upstream, never computed here. */
  durationLabel?: string;
  notes?: string;
  onPress?: () => void;

  /** Each action renders ONLY when its handler is provided — never assumed. */
  onEdit?: () => void;
  editLabel?: string;
  onComplete?: () => void;
  completeLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  onDelete?: () => void;
  deleteLabel?: string;
  /** Accessibility label for the "⋯" overflow trigger that reveals Delete. */
  moreActionsLabel?: string;

  layout?: BookingCardLayout;
  compact?: boolean;
  loading?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

const colors = {
  // Glass surface: base Royal Cosmos navy-violet at ~88% opacity — the
  // "dark transparency" the correction calls for, not a flat opaque fill.
  surfaceGlass: 'rgba(23,25,56,0.88)',
  surfaceGlassSelected: 'rgba(34,36,79,0.92)',
  borderGlow: 'rgba(124,92,255,0.22)',
  borderGlowSelected: 'rgba(124,92,255,0.5)',
  glow: 'rgba(124,92,255,0.16)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  royal: '#7C5CFF',
  green: '#3FCF8E',
  greenSoft: 'rgba(63,207,142,0.14)',
  amber: '#F2B84B',
  amberSoft: 'rgba(242,184,75,0.14)',
  danger: '#F2617A',
  dangerSoft: 'rgba(242,97,122,0.14)',
} as const;

const statusToneMap: Record<BookingStatus, { fg: string; bg: string }> = {
  scheduled: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.14)' },
  completed: { fg: colors.green, bg: colors.greenSoft },
  cancelled: { fg: colors.danger, bg: colors.dangerSoft },
};

function StatusChip({ status, label }: { status: BookingStatus; label: string }) {
  const tone = statusToneMap[status];
  return (
    <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.statusText, { color: tone.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Compact pill button — never a full-width bar. */
function ActionPill({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: 'outline' | 'green' | 'amber' | 'danger';
}) {
  const variantStyle =
    variant === 'green'
      ? { bg: colors.greenSoft, fg: colors.green, border: 'transparent' }
      : variant === 'amber'
      ? { bg: colors.amberSoft, fg: colors.amber, border: 'transparent' }
      : variant === 'danger'
      ? { bg: colors.dangerSoft, fg: colors.danger, border: 'transparent' }
      : { bg: 'transparent', fg: colors.royal, border: 'rgba(124,92,255,0.4)' };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionPill,
        { backgroundColor: variantStyle.bg, borderColor: variantStyle.border },
        pressed && styles.actionPillPressed,
      ]}
    >
      <Text style={[styles.actionPillText, { color: variantStyle.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function OverflowTrigger({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.overflowTrigger, pressed && styles.overflowTriggerPressed]}
    >
      <Text style={styles.overflowDots}>⋯</Text>
    </Pressable>
  );
}

/**
 * BookingCardV2 — compact dark glass Royal Cosmos panel. Hierarchy:
 * TIME → CLIENT → SERVICE → STATUS → ACTIONS. Every action renders only
 * when its handler is supplied. Delete is tucked behind a small overflow
 * toggle rather than sitting as a permanent bright pill — never a
 * full-width bar, never a dominant semantic color. Data-agnostic: no
 * t(), no fetch, no business logic.
 */
function BookingCardV2({
  time,
  endTime,
  clientName,
  clientFallbackLabel,
  serviceName,
  serviceFallbackLabel,
  status,
  statusLabel,
  staffName,
  durationLabel,
  notes,
  onPress,
  onEdit,
  editLabel,
  onComplete,
  completeLabel,
  onCancel,
  cancelLabel,
  onDelete,
  deleteLabel,
  moreActionsLabel,
  layout = 'stacked',
  compact = false,
  loading = false,
  selected = false,
  disabled = false,
}: BookingCardV2Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const hasMeta = !!staffName || !!durationLabel;
  const hasPrimaryActions = (!!onEdit || !!onComplete || !!onCancel) && !loading && !disabled;
  const hasDelete = !!onDelete && !loading && !disabled;
  const isInteractive = !!onPress && !disabled && !loading;
  const CardShell = isInteractive ? Pressable : View;

  if (loading) {
    return (
      <View style={[styles.card, { padding: compact ? 12 : 16 }, styles.loadingCard]}>
        <ActivityIndicator color={colors.textSecondary} />
      </View>
    );
  }

  const metaRow = hasMeta && (
    <View style={styles.metaRow}>
      {!!staffName && (
        <Text style={styles.metaText} numberOfLines={1}>
          {staffName}
        </Text>
      )}
      {!!durationLabel && (
        <Text style={styles.metaText} numberOfLines={1}>
          {staffName ? ` · ${durationLabel}` : durationLabel}
        </Text>
      )}
    </View>
  );

  const notesText = !!notes && (
    <Text style={styles.notesText} numberOfLines={2}>
      {notes}
    </Text>
  );

  const actionsCluster = (hasPrimaryActions || hasDelete) && (
    <View style={styles.actionsCluster}>
      <View style={styles.actionsRow}>
        {!!onEdit && <ActionPill label={editLabel ?? ''} onPress={onEdit} variant="outline" />}
        {!!onComplete && <ActionPill label={completeLabel ?? ''} onPress={onComplete} variant="green" />}
        {!!onCancel && <ActionPill label={cancelLabel ?? ''} onPress={onCancel} variant="amber" />}
        {hasDelete && (
          <OverflowTrigger onPress={() => setOverflowOpen((v) => !v)} accessibilityLabel={moreActionsLabel} />
        )}
      </View>
      {overflowOpen && hasDelete && (
        <View style={styles.overflowRevealRow}>
          <ActionPill label={deleteLabel ?? ''} onPress={onDelete!} variant="danger" />
        </View>
      )}
    </View>
  );

  const glow = (
    <View style={styles.glowWrap} pointerEvents="none">
      <View style={styles.glowCircle} />
    </View>
  );

  if (layout === 'row') {
    return (
      <CardShell
        onPress={isInteractive ? onPress : undefined}
        accessibilityRole={isInteractive ? 'button' : undefined}
        accessibilityState={{ selected, disabled }}
        style={({ pressed }: any) => [
          styles.card,
          styles.cardRow,
          { padding: compact ? 12 : 16 },
          selected && styles.cardSelected,
          disabled && styles.cardDisabled,
          isInteractive && pressed ? styles.cardPressed : null,
        ]}
      >
        {glow}
        <View style={styles.rowLeftCol}>
          <View style={styles.rowTimeLine}>
            <Text style={styles.timeStart} numberOfLines={1}>
              {time}
            </Text>
            {!!endTime && (
              <Text style={styles.timeEndInline} numberOfLines={1}>
                {' '}
                – {endTime}
              </Text>
            )}
          </View>
          <Text style={styles.clientName} numberOfLines={1}>
            {clientName || clientFallbackLabel}
          </Text>
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName || serviceFallbackLabel}
          </Text>
          {metaRow}
          {notesText}
        </View>

        <View style={styles.rowRightCol}>
          <StatusChip status={status} label={statusLabel} />
          {actionsCluster}
        </View>
      </CardShell>
    );
  }

  // stacked (mobile)
  return (
    <CardShell
      onPress={isInteractive ? onPress : undefined}
      accessibilityRole={isInteractive ? 'button' : undefined}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }: any) => [
        styles.card,
        { padding: compact ? 12 : 16 },
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        isInteractive && pressed ? styles.cardPressed : null,
      ]}
    >
      {glow}
      <View style={styles.stackedTopRow}>
        <View style={styles.timeCol}>
          <Text style={styles.timeStart} numberOfLines={1}>
            {time}
          </Text>
          {!!endTime && (
            <Text style={styles.timeEnd} numberOfLines={1}>
              {endTime}
            </Text>
          )}
        </View>
        <StatusChip status={status} label={statusLabel} />
      </View>

      <Text style={styles.clientNameStacked} numberOfLines={1}>
        {clientName || clientFallbackLabel}
      </Text>
      <Text style={styles.serviceName} numberOfLines={1}>
        {serviceName || serviceFallbackLabel}
      </Text>
      {metaRow}
      {notesText}
      {actionsCluster}
    </CardShell>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: '100%',
    minHeight: 148,
    borderRadius: 24,
    backgroundColor: 'rgba(15,18,48,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(126,105,255,0.42)',
    shadowColor: '#050611',
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 15 },
    elevation: 10,
    overflow: 'hidden',
  },
  cardRow: {
    minHeight: 154,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  loadingCard: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGlass,
    borderRadius: 18,
  },
  cardPressed: {
    backgroundColor: colors.surfaceGlassSelected,
  },
  cardSelected: {
    backgroundColor: colors.surfaceGlassSelected,
    borderColor: colors.borderGlowSelected,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  glowWrap: {
    position: 'absolute',
    top: -58,
    right: -42,
    width: 170,
    height: 170,
    opacity: 0.9,
  },
  glowCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(93,107,255,0.22)',
  },

  // ---- stacked (mobile) ----
  stackedTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeStart: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  timeEnd: {
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  clientNameStacked: {
    marginTop: 16,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.35,
    color: colors.textPrimary,
  },

  // ---- row (desktop) ----
  rowLeftCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 24,
    justifyContent: 'center',
  },
  rowTimeLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  timeEndInline: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  clientName: {
    marginTop: 14,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.35,
    color: colors.textPrimary,
  },
  rowRightCol: {
    minWidth: 250,
    maxWidth: 340,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 22,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },

  // ---- shared ----
  serviceName: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#C5C7E7',
  },
  metaRow: {
    marginTop: 11,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#8588AD',
  },
  notesText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: '#8588AD',
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 30,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: 170,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  statusText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.15,
  },

  actionsCluster: {
    marginTop: 18,
    alignSelf: 'stretch',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionPill: {
    minHeight: 34,
    minWidth: 72,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
    marginTop: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillPressed: {
    opacity: 0.75,
  },
  actionPillText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  overflowTrigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  overflowTriggerPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  overflowDots: {
    fontSize: 14,
    lineHeight: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  overflowRevealRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
});

export default React.memo(BookingCardV2);
