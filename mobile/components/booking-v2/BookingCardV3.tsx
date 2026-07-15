import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  BookingCardLayout,
  BookingCardV2Props,
  BookingStatus,
} from './BookingCardV2';

export type {
  BookingCardLayout,
  BookingCardV2Props,
  BookingStatus,
} from './BookingCardV2';

const palette = {
  surface: 'rgba(12, 15, 43, 0.97)',
  surfacePressed: 'rgba(24, 28, 70, 0.99)',
  surfaceSelected: 'rgba(27, 31, 77, 0.99)',

  border: 'rgba(137, 116, 255, 0.48)',
  borderSoft: 'rgba(255, 255, 255, 0.09)',
  borderSelected: 'rgba(151, 133, 255, 0.82)',

  textPrimary: '#F8F7FF',
  textSecondary: '#C6C8E8',
  textMuted: '#8588AC',

  royal: '#8B72FF',
  blue: '#67C2FF',
  green: '#47D69A',
  amber: '#F2BC58',
  danger: '#F36D84',

  royalSoft: 'rgba(139, 114, 255, 0.14)',
  blueSoft: 'rgba(103, 194, 255, 0.14)',
  greenSoft: 'rgba(71, 214, 154, 0.14)',
  amberSoft: 'rgba(242, 188, 88, 0.14)',
  dangerSoft: 'rgba(243, 109, 132, 0.14)',
} as const;

const statusTone: Record<
  BookingStatus,
  { foreground: string; background: string; border: string }
> = {
  scheduled: {
    foreground: palette.blue,
    background: palette.blueSoft,
    border: 'rgba(103, 194, 255, 0.32)',
  },
  completed: {
    foreground: palette.green,
    background: palette.greenSoft,
    border: 'rgba(71, 214, 154, 0.32)',
  },
  cancelled: {
    foreground: palette.danger,
    background: palette.dangerSoft,
    border: 'rgba(243, 109, 132, 0.32)',
  },
};

type ActionTone = 'royal' | 'green' | 'amber' | 'danger';

function StatusBadge({
  status,
  label,
}: {
  status: BookingStatus;
  label: string;
}) {
  const tone = statusTone[status];

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
      ]}
    >
      <View
        style={[
          styles.statusSignal,
          {
            backgroundColor: tone.foreground,
            shadowColor: tone.foreground,
          },
        ]}
      />

      <Text
        numberOfLines={1}
        style={[styles.statusLabel, { color: tone.foreground }]}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: ActionTone;
  onPress: () => void;
}) {
  const visual =
    tone === 'green'
      ? {
          foreground: palette.green,
          background: palette.greenSoft,
          border: 'rgba(71, 214, 154, 0.30)',
        }
      : tone === 'amber'
        ? {
            foreground: palette.amber,
            background: palette.amberSoft,
            border: 'rgba(242, 188, 88, 0.30)',
          }
        : tone === 'danger'
          ? {
              foreground: palette.danger,
              background: palette.dangerSoft,
              border: 'rgba(243, 109, 132, 0.30)',
            }
          : {
              foreground: palette.royal,
              background: palette.royalSoft,
              border: 'rgba(139, 114, 255, 0.34)',
            };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: visual.background,
          borderColor: visual.border,
        },
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.actionButtonLabel, { color: visual.foreground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BookingCardV3({
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

  layout = 'stacked',
  compact = false,
  loading = false,
  selected = false,
  disabled = false,
}: BookingCardV2Props) {
  const isInteractive = Boolean(onPress) && !loading && !disabled;
  const isRow = layout === 'row';

  const resolvedClient =
    clientName?.trim() || clientFallbackLabel?.trim() || '—';

  const resolvedService =
    serviceName?.trim() || serviceFallbackLabel?.trim() || '—';

  const hasMeta = Boolean(staffName || durationLabel);
  const hasActions = Boolean(
    !loading &&
      !disabled &&
      (onEdit || onComplete || onCancel || onDelete),
  );

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={palette.royal} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole={isInteractive ? 'button' : undefined}
      accessibilityState={{ disabled, selected }}
      disabled={!isInteractive}
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        isRow ? styles.cardRow : styles.cardStacked,
        compact && styles.cardCompact,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        pressed && isInteractive && styles.cardPressed,
      ]}
    >
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.leftAccent} pointerEvents="none" />

      {isRow ? (
        <>
          <View style={styles.desktopInfo}>
            <View style={styles.timeRow}>
              <Text numberOfLines={1} style={styles.timePrimary}>
                {time}
              </Text>

              {!!endTime && (
                <>
                  <View style={styles.timeDivider} />
                  <Text numberOfLines={1} style={styles.timeSecondary}>
                    {endTime}
                  </Text>
                </>
              )}
            </View>

            <Text numberOfLines={1} style={styles.clientDesktop}>
              {resolvedClient}
            </Text>

            <Text numberOfLines={1} style={styles.service}>
              {resolvedService}
            </Text>

            {hasMeta && (
              <View style={styles.metaRow}>
                {!!staffName && (
                  <View style={styles.metaCapsule}>
                    <Text numberOfLines={1} style={styles.metaText}>
                      {staffName}
                    </Text>
                  </View>
                )}

                {!!durationLabel && (
                  <View style={styles.metaCapsule}>
                    <Text numberOfLines={1} style={styles.metaText}>
                      {durationLabel}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!!notes && (
              <Text numberOfLines={2} style={styles.notes}>
                {notes}
              </Text>
            )}
          </View>

          <View style={styles.desktopControl}>
            <StatusBadge status={status} label={statusLabel} />

            {hasActions && (
              <View style={styles.desktopActions}>
                {!!onEdit && (
                  <ActionButton
                    label={editLabel || ''}
                    tone="royal"
                    onPress={onEdit}
                  />
                )}

                {!!onComplete && (
                  <ActionButton
                    label={completeLabel || ''}
                    tone="green"
                    onPress={onComplete}
                  />
                )}

                {!!onCancel && (
                  <ActionButton
                    label={cancelLabel || ''}
                    tone="amber"
                    onPress={onCancel}
                  />
                )}

                {!!onDelete && (
                  <ActionButton
                    label={deleteLabel || ''}
                    tone="danger"
                    onPress={onDelete}
                  />
                )}
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <View style={styles.mobileTopRow}>
            <View style={styles.mobileTimeBlock}>
              <Text numberOfLines={1} style={styles.timePrimary}>
                {time}
              </Text>

              {!!endTime && (
                <Text numberOfLines={1} style={styles.timeSecondaryMobile}>
                  {endTime}
                </Text>
              )}
            </View>

            <StatusBadge status={status} label={statusLabel} />
          </View>

          <View style={styles.mobileContent}>
            <Text numberOfLines={1} style={styles.clientMobile}>
              {resolvedClient}
            </Text>

            <Text numberOfLines={1} style={styles.service}>
              {resolvedService}
            </Text>

            {hasMeta && (
              <View style={styles.metaRow}>
                {!!staffName && (
                  <View style={styles.metaCapsule}>
                    <Text numberOfLines={1} style={styles.metaText}>
                      {staffName}
                    </Text>
                  </View>
                )}

                {!!durationLabel && (
                  <View style={styles.metaCapsule}>
                    <Text numberOfLines={1} style={styles.metaText}>
                      {durationLabel}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!!notes && (
              <Text numberOfLines={2} style={styles.notes}>
                {notes}
              </Text>
            )}
          </View>

          {hasActions && (
            <View style={styles.mobileActions}>
              {!!onEdit && (
                <ActionButton
                  label={editLabel || ''}
                  tone="royal"
                  onPress={onEdit}
                />
              )}

              {!!onComplete && (
                <ActionButton
                  label={completeLabel || ''}
                  tone="green"
                  onPress={onComplete}
                />
              )}

              {!!onCancel && (
                <ActionButton
                  label={cancelLabel || ''}
                  tone="amber"
                  onPress={onCancel}
                />
              )}

              {!!onDelete && (
                <ActionButton
                  label={deleteLabel || ''}
                  tone="danger"
                  onPress={onDelete}
                />
              )}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: '100%',
    minHeight: 156,
    borderRadius: 24,

    backgroundColor: palette.surface,

    borderWidth: 1,
    borderColor: palette.border,

    shadowColor: '#02030D',
    shadowOpacity: 0.58,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 16,
    },

    elevation: 12,
    overflow: 'hidden',
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    padding: 20,
  },

  cardStacked: {
    padding: 18,
  },

  cardCompact: {
    minHeight: 138,
    padding: 15,
  },

  cardSelected: {
    backgroundColor: palette.surfaceSelected,
    borderColor: palette.borderSelected,
  },

  cardPressed: {
    backgroundColor: palette.surfacePressed,
    borderColor: 'rgba(151, 133, 255, 0.74)',
    transform: [{ scale: 0.997 }],
  },

  cardDisabled: {
    opacity: 0.52,
  },

  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 1,
    backgroundColor: 'rgba(210, 205, 255, 0.36)',
  },

  leftAccent: {
    position: 'absolute',
    top: 24,
    bottom: 24,
    left: 0,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: palette.royal,
    opacity: 0.78,
  },

  desktopInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 26,
  },

  desktopControl: {
    width: 320,
    maxWidth: '42%',
    alignItems: 'flex-end',
    justifyContent: 'space-between',

    paddingLeft: 24,

    borderLeftWidth: 1,
    borderLeftColor: palette.borderSoft,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timePrimary: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: -0.42,
    color: palette.textPrimary,
  },

  timeDivider: {
    width: 20,
    height: 1,
    marginHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  timeSecondary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: palette.textMuted,
  },

  timeSecondaryMobile: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: palette.textMuted,
  },

  clientDesktop: {
    marginTop: 16,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: palette.textPrimary,
  },

  clientMobile: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.38,
    color: palette.textPrimary,
  },

  service: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: palette.textSecondary,
  },

  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaCapsule: {
    minHeight: 28,
    justifyContent: 'center',

    marginRight: 8,
    marginBottom: 7,

    paddingVertical: 5,
    paddingHorizontal: 10,

    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',

    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  metaText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: palette.textMuted,
  },

  notes: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
  },

  statusBadge: {
    minHeight: 31,

    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 6,
    paddingHorizontal: 11,

    borderRadius: 999,
    borderWidth: 1,

    maxWidth: 180,
  },

  statusSignal: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,

    shadowOpacity: 0.72,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  statusLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.16,
  },

  desktopActions: {
    width: '100%',
    marginTop: 20,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',

    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },

  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    paddingBottom: 14,

    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },

  mobileTimeBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },

  mobileContent: {
    paddingTop: 16,
  },

  mobileActions: {
    marginTop: 18,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',

    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },

  actionButton: {
    minWidth: 72,
    minHeight: 35,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 8,
    marginTop: 8,

    paddingVertical: 8,
    paddingHorizontal: 14,

    borderRadius: 999,
    borderWidth: 1,
  },

  actionButtonPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },

  actionButtonLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
});

export default React.memo(BookingCardV3);
