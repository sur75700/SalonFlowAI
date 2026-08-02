import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";

import type {
  BookingCardLayout,
  BookingCardV2Props,
  BookingStatus,
} from "./BookingCardV2";

export type {
  BookingCardLayout,
  BookingCardV2Props,
  BookingStatus,
} from "./BookingCardV2";

const palette = {
  surface: "rgba(10, 13, 36, 0.94)",
  surfacePressed: "rgba(21, 25, 62, 0.98)",
  surfaceSelected: "rgba(26, 30, 72, 0.98)",

  border: "rgba(139, 114, 255, 0.34)",
  borderSoft: "rgba(255, 255, 255, 0.075)",
  borderSelected: "rgba(160, 143, 255, 0.78)",

  textPrimary: "#FBFAFF",
  textSecondary: "#D2D4EE",
  textMuted: "#9295B8",

  royal: "#8B72FF",
  blue: "#67C2FF",
  green: "#47D69A",
  amber: "#F2BC58",
  danger: "#F36D84",

  royalSoft: "rgba(139, 114, 255, 0.14)",
  blueSoft: "rgba(103, 194, 255, 0.14)",
  greenSoft: "rgba(71, 214, 154, 0.14)",
  amberSoft: "rgba(242, 188, 88, 0.14)",
  dangerSoft: "rgba(243, 109, 132, 0.14)",
} as const;

const statusTone: Record<
  BookingStatus,
  { foreground: string; background: string; border: string }
> = {
  scheduled: {
    foreground: palette.blue,
    background: palette.blueSoft,
    border: "rgba(103, 194, 255, 0.32)",
  },
  completed: {
    foreground: palette.green,
    background: palette.greenSoft,
    border: "rgba(71, 214, 154, 0.32)",
  },
  cancelled: {
    foreground: palette.danger,
    background: palette.dangerSoft,
    border: "rgba(243, 109, 132, 0.32)",
  },
};

type ActionTone = "royal" | "green" | "amber" | "danger";

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
    tone === "green"
      ? {
          foreground: palette.green,
          background: palette.greenSoft,
          border: "rgba(71, 214, 154, 0.30)",
        }
      : tone === "amber"
        ? {
            foreground: palette.amber,
            background: palette.amberSoft,
            border: "rgba(242, 188, 88, 0.30)",
          }
        : tone === "danger"
          ? {
              foreground: palette.danger,
              background: palette.dangerSoft,
              border: "rgba(243, 109, 132, 0.30)",
            }
          : {
              foreground: palette.royal,
              background: palette.royalSoft,
              border: "rgba(139, 114, 255, 0.34)",
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
  dateLabel,
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

  layout = "stacked",
  compact = false,
  loading = false,
  selected = false,
  disabled = false,
}: BookingCardV2Props) {
  const { locale } = useAppPreferences();
  const clientLabel = t("Client", locale as any).toUpperCase();
  const serviceLabel = t("Service", locale as any).toUpperCase();

  const isInteractive = Boolean(onPress) && !loading && !disabled;
  const isRow = layout === "row";

  const resolvedClient =
    clientName?.trim() || clientFallbackLabel?.trim() || "—";

  const resolvedService =
    serviceName?.trim() || serviceFallbackLabel?.trim() || "—";

  const hasMeta = Boolean(staffName || durationLabel);
  const hasActions = Boolean(
    !loading && !disabled && (onEdit || onComplete || onCancel || onDelete),
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
      accessibilityRole={isInteractive ? "button" : undefined}
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
            <View style={styles.dateTimeHero}>
              {!!dateLabel && (
                <Text numberOfLines={1} style={styles.dateLabel}>
                  {dateLabel}
                </Text>
              )}

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
            </View>

            <View style={styles.desktopIdentity}>
              <Text numberOfLines={1} style={styles.clientEyebrow}>{clientLabel}</Text>

              <Text numberOfLines={1} style={styles.clientDesktop}>
                {resolvedClient}
              </Text>
            </View>

            <View style={styles.serviceHero}>
              <Text numberOfLines={1} style={styles.serviceEyebrow}>{serviceLabel}</Text>

              <Text numberOfLines={2} style={styles.service}>
                {resolvedService}
              </Text>
            </View>

            {hasMeta && (
              <View style={styles.metaRow}>
                {!!durationLabel && (
                  <View style={[styles.metaCapsule, styles.durationCapsule]}>
                    <Text numberOfLines={1} style={styles.metaTextStrong}>
                      {durationLabel}
                    </Text>
                  </View>
                )}

                {!!staffName && (
                  <View style={styles.metaCapsule}>
                    <Text numberOfLines={1} style={styles.metaText}>
                      {staffName}
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
                {!!onComplete && (
                  <ActionButton
                    label={completeLabel || ""}
                    tone="green"
                    onPress={onComplete}
                  />
                )}

                {!!onEdit && (
                  <ActionButton
                    label={editLabel || ""}
                    tone="royal"
                    onPress={onEdit}
                  />
                )}

                {!!onCancel && (
                  <ActionButton
                    label={cancelLabel || ""}
                    tone="amber"
                    onPress={onCancel}
                  />
                )}

                {!!onDelete && (
                  <ActionButton
                    label={deleteLabel || ""}
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
              {!!dateLabel && (
                <Text numberOfLines={1} style={styles.dateLabelMobile}>
                  {dateLabel}
                </Text>
              )}

              <View style={styles.timeRowMobile}>
                <Text numberOfLines={1} style={styles.timePrimaryMobile}>
                  {time}
                </Text>

                {!!endTime && (
                  <>
                    <View style={styles.timeDividerMobile} />
                    <Text numberOfLines={1} style={styles.timeSecondaryMobile}>
                      {endTime}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <StatusBadge status={status} label={statusLabel} />
          </View>

          <View style={styles.mobileContent}>
            <Text numberOfLines={1} style={styles.clientEyebrow}>{clientLabel}</Text>

            <Text numberOfLines={1} style={styles.clientMobile}>
              {resolvedClient}
            </Text>

            <View style={styles.serviceHeroMobile}>
              <Text numberOfLines={1} style={styles.serviceEyebrow}>{serviceLabel}</Text>

              <Text numberOfLines={2} style={styles.service}>
                {resolvedService}
              </Text>
            </View>

            {hasMeta && (
              <View style={styles.metaRow}>
                {!!durationLabel && (
                  <View style={[styles.metaCapsule, styles.durationCapsule]}>
                    <Text numberOfLines={1} style={styles.metaTextStrong}>
                      {durationLabel}
                    </Text>
                  </View>
                )}

                {!!staffName && (
                  <View style={styles.metaCapsule}>
                    <Text numberOfLines={1} style={styles.metaText}>
                      {staffName}
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
              {!!onComplete && (
                <ActionButton
                  label={completeLabel || ""}
                  tone="green"
                  onPress={onComplete}
                />
              )}

              {!!onEdit && (
                <ActionButton
                  label={editLabel || ""}
                  tone="royal"
                  onPress={onEdit}
                />
              )}

              {!!onCancel && (
                <ActionButton
                  label={cancelLabel || ""}
                  tone="amber"
                  onPress={onCancel}
                />
              )}

              {!!onDelete && (
                <ActionButton
                  label={deleteLabel || ""}
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
    position: "relative",
    width: "100%",
    minHeight: 184,
    borderRadius: 28,

    backgroundColor: palette.surface,

    borderWidth: 1,
    borderColor: palette.border,

    shadowColor: "#02030D",
    shadowOpacity: 0.5,
    shadowRadius: 32,
    shadowOffset: {
      width: 0,
      height: 18,
    },

    elevation: 14,
    overflow: "hidden",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    paddingVertical: 24,
    paddingHorizontal: 26,
  },

  cardStacked: {
    paddingVertical: 22,
    paddingHorizontal: 20,
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
    borderColor: "rgba(151, 133, 255, 0.74)",
    transform: [{ scale: 0.997 }],
  },

  cardDisabled: {
    opacity: 0.52,
  },

  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 26,
    right: 26,
    height: 1,
    backgroundColor: "rgba(224, 219, 255, 0.3)",
  },

  leftAccent: {
    position: "absolute",
    top: 26,
    bottom: 26,
    left: 0,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: palette.royal,
    opacity: 0.64,
  },

  desktopInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 36,
  },

  desktopIdentity: {
    marginTop: 16,
  },

  desktopControl: {
    width: 280,
    maxWidth: "34%",
    alignItems: "flex-end",
    justifyContent: "space-between",

    paddingLeft: 26,

    borderLeftWidth: 1,
    borderLeftColor: palette.borderSoft,
  },

  dateTimeHero: {
    minWidth: 0,
  },

  dateLabel: {
    marginBottom: 6,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.24,
    color: palette.royal,
    textTransform: "uppercase",
  },

  dateLabelMobile: {
    marginBottom: 5,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 1.08,
    color: palette.royal,
    textTransform: "uppercase",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  timeRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  timePrimary: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.56,
    color: palette.textPrimary,
  },

  timePrimaryMobile: {
    flexShrink: 1,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.46,
    color: palette.textPrimary,
  },

  timeDivider: {
    width: 24,
    height: 1,
    marginHorizontal: 10,
    backgroundColor: "rgba(139,114,255,0.52)",
  },

  timeDividerMobile: {
    flexShrink: 1,
    width: 18,
    minWidth: 8,
    height: 1,
    marginHorizontal: 7,
    backgroundColor: "rgba(139,114,255,0.52)",
  },

  timeSecondary: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: palette.textSecondary,
  },

  timeSecondaryMobile: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: palette.textSecondary,
  },

  clientEyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: palette.textMuted,
  },

  clientDesktop: {
    marginTop: 4,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: palette.textPrimary,
  },

  clientMobile: {
    marginTop: 4,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.44,
    color: palette.textPrimary,
  },

  serviceHero: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: palette.royalSoft,
    borderWidth: 1,
    borderColor: "rgba(139,114,255,0.26)",
  },

  serviceHeroMobile: {
    marginTop: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: palette.royalSoft,
    borderWidth: 1,
    borderColor: "rgba(139,114,255,0.26)",
  },

  serviceEyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.18,
    color: palette.royal,
  },

  service: {
    marginTop: 4,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.34,
    color: palette.textPrimary,
  },

  metaRow: {
    marginTop: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },

  metaCapsule: {
    minHeight: 31,
    justifyContent: "center",

    marginRight: 8,
    marginBottom: 7,

    paddingVertical: 6,
    paddingHorizontal: 12,

    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",

    backgroundColor: "rgba(255,255,255,0.05)",
  },

  durationCapsule: {
    backgroundColor: palette.blueSoft,
    borderColor: "rgba(103,194,255,0.24)",
  },

  metaText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    color: palette.textMuted,
  },

  metaTextStrong: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 0.12,
    color: palette.blue,
  },

  notes: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
  },

  statusBadge: {
    minHeight: 34,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 7,
    paddingHorizontal: 12,

    borderRadius: 999,
    borderWidth: 1,

    maxWidth: 180,
  },

  statusSignal: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,

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
    fontWeight: "900",
    letterSpacing: 0.26,
    textTransform: "uppercase",
  },

  desktopActions: {
    width: "100%",
    marginTop: 24,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",

    paddingTop: 14,

    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },

  mobileTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",

    paddingBottom: 16,

    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },

  mobileTimeBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },

  mobileContent: {
    paddingTop: 18,
  },

  mobileActions: {
    marginTop: 20,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",

    paddingTop: 14,

    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },

  actionButton: {
    minWidth: 82,
    minHeight: 39,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 8,
    marginTop: 8,

    paddingVertical: 10,
    paddingHorizontal: 16,

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
    fontWeight: "900",
    letterSpacing: 0.1,
  },
});

export default React.memo(BookingCardV3);
