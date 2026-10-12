import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";
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
  surface: "rgba(8, 11, 31, 0.90)",
  surfacePressed: "rgba(18, 22, 58, 0.97)",
  surfaceSelected: "rgba(24, 28, 70, 0.98)",
  surfaceInner: "rgba(28, 31, 78, 0.62)",

  border: "rgba(169, 147, 255, 0.46)",
  borderSoft: "rgba(255, 255, 255, 0.10)",
  borderSelected: "rgba(183, 166, 255, 0.90)",

  textPrimary: "#FBFAFF",
  textSecondary: "#D2D4EE",
  textMuted: "#9295B8",

  royal: "#8B72FF",
  blue: "#67C2FF",
  green: "#47D69A",
  amber: "#F2BC58",
  danger: "#F36D84",
  gold: "#E8C97A",

  royalSoft: "rgba(139, 114, 255, 0.18)",
  blueSoft: "rgba(103, 194, 255, 0.17)",
  greenSoft: "rgba(71, 214, 154, 0.16)",
  amberSoft: "rgba(242, 188, 88, 0.14)",
  dangerSoft: "rgba(243, 109, 132, 0.14)",
  goldSoft: "rgba(232, 201, 122, 0.14)",
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
type ClientPriorityStatus = BookingCardV2Props["clientStatus"];
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

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

function ClientPriorityBadge({
  status,
  newLabel,
}: {
  status: ClientPriorityStatus;
  newLabel: string;
}) {
  if (status !== "vip" && status !== "new") return null;

  const vip = status === "vip";
  const color = vip ? palette.gold : palette.blue;
  const backgroundColor = vip ? palette.goldSoft : palette.blueSoft;

  return (
    <View style={[styles.priorityBadge, { borderColor: color, backgroundColor }]}>
      <Ionicons
        name={vip ? "diamond-outline" : "sparkles-outline"}
        size={12}
        color={color}
      />
      <Text style={[styles.priorityBadgeText, { color }]}>
        {vip ? "VIP" : newLabel}
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
          icon: "checkmark-circle-outline" as IoniconName,
        }
      : tone === "amber"
        ? {
            foreground: palette.amber,
            background: palette.amberSoft,
            border: "rgba(242, 188, 88, 0.30)",
            icon: "close-circle-outline" as IoniconName,
          }
        : tone === "danger"
          ? {
              foreground: palette.danger,
              background: palette.dangerSoft,
              border: "rgba(243, 109, 132, 0.30)",
              icon: "trash-outline" as IoniconName,
            }
          : {
              foreground: palette.royal,
              background: palette.royalSoft,
              border: "rgba(139, 114, 255, 0.34)",
              icon: "create-outline" as IoniconName,
            };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: visual.background,
          borderColor: visual.border,
        },
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Ionicons name={visual.icon} size={14} color={visual.foreground} />
      <Text
        numberOfLines={1}
        style={[styles.actionButtonLabel, { color: visual.foreground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getInitials(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.length
    ? parts.map((part) => part[0]?.toUpperCase() || "").join("")
    : "•";
}

function resolveServiceIconName(
  iconKey: string | null | undefined,
  serviceName: string,
): IoniconName {
  const key = (iconKey || "").toLowerCase();
  const name = serviceName.toLowerCase();

  const explicit: Record<string, IoniconName> = {
    haircut: "cut-outline",
    styling: "brush-outline",
    color: "color-palette-outline",
    makeup: "color-wand-outline",
    nails: "hand-left-outline",
    brows: "eye-outline",
    facial: "sparkles-outline",
    spa: "leaf-outline",
    massage: "body-outline",
    bridal: "diamond-outline",
    waxing: "flame-outline",
    laser: "flash-outline",
    barber: "person-outline",
    wellness: "heart-outline",
    premium: "diamond-outline",
    kids: "happy-outline",
    body: "body-outline",
    skincare: "water-outline",
    car_wash: "car-outline",
    detailing: "sparkles-outline",
    interior: "home-outline",
    ceramic: "shield-checkmark-outline",
    paint: "color-palette-outline",
    polish: "sparkles-outline",
    tint: "contrast-outline",
    wheels: "ellipse-outline",
    engine: "settings-outline",
    protection: "shield-checkmark-outline",
  };

  if (explicit[key]) return explicit[key];
  if (/car|detail|wash|wheel|engine|ceramic|tint/.test(name)) return "car-outline";
  if (/nail|manicure|pedicure/.test(name)) return "hand-left-outline";
  if (/hair|balayage|color|barber|cut/.test(name)) return "cut-outline";
  if (/makeup|brow|lash/.test(name)) return "color-wand-outline";
  if (/massage|body|wellness/.test(name)) return "body-outline";
  if (/facial|skin|glow|spa/.test(name)) return "sparkles-outline";

  return "sparkles-outline";
}

function BookingCardV3({
  dateLabel,
  time,
  endTime,
  clientName,
  clientFallbackLabel,
  serviceName,
  serviceFallbackLabel,
  clientStatus,
  serviceIconKey,
  priceLabel,
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
  const { selectedThemeId, theme: dashboardTheme } = useDashboardTheme();
  const isRoyalCosmos = selectedThemeId === "royal_cosmos";
  const isBurgundyCosmos = selectedThemeId === "burgundy_cosmos";
  const royalCosmosSurfaceStyle = isRoyalCosmos
    ? {
        backgroundColor: "rgba(8, 11, 31, 0.82)",
        borderColor: "rgba(151, 133, 255, 0.62)",
        shadowColor: dashboardTheme.palette.royal,
        shadowOpacity: 0.30,
        shadowRadius: 32,
      }
    : undefined;
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

  const { locale } = useAppPreferences();
  const clientLabel = t("Client", locale as any).toUpperCase();
  const serviceLabel = t("Service", locale as any).toUpperCase();
  const openAppointmentLabel = t("Open Appointment", locale as any);
  const newClientLabel = t("Client V2 New", locale as any);

  const isInteractive = Boolean(onPress) && !loading && !disabled;
  const isRow = layout === "row";

  const resolvedClient =
    clientName?.trim() || clientFallbackLabel?.trim() || "—";
  const resolvedService =
    serviceName?.trim() || serviceFallbackLabel?.trim() || "—";
  const initials = getInitials(resolvedClient);
  const serviceIcon = resolveServiceIconName(serviceIconKey, resolvedService);

  const priorityAccent =
    clientStatus === "vip"
      ? palette.gold
      : clientStatus === "new"
        ? palette.blue
        : undefined;
  const priorityCardStyle = priorityAccent
    ? {
        borderColor: priorityAccent,
        shadowColor: priorityAccent,
        shadowOpacity: clientStatus === "vip" ? 0.26 : 0.22,
        shadowRadius: 34,
      }
    : undefined;

  const hasMeta = Boolean(staffName || durationLabel || priceLabel);
  const hasActions = Boolean(
    !loading && !disabled && (onEdit || onComplete || onCancel || onDelete),
  );

  const actions = hasActions ? (
    <View style={isRow ? styles.desktopActions : styles.mobileActions}>
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
  ) : null;

  if (loading) {
    return (
      <View style={[styles.card, royalCosmosSurfaceStyle, burgundySurfaceStyle, styles.loadingCard]}>
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
        royalCosmosSurfaceStyle,
        burgundySurfaceStyle,
        priorityCardStyle,
        isRow ? styles.cardRow : styles.cardStacked,
        compact && styles.cardCompact,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        pressed && isInteractive && styles.cardPressed,
      ]}
    >
      <View pointerEvents="none" style={styles.bookingCosmicSheen} />
      <View pointerEvents="none" style={styles.bookingCosmicSheenBlue} />
      <View pointerEvents="none" style={styles.topHighlight} />
      <View
        pointerEvents="none"
        style={[
          styles.leftAccent,
          priorityAccent ? { backgroundColor: priorityAccent, opacity: 0.96 } : null,
        ]}
      />

      <View style={styles.commandHeader}>
        <View style={styles.dateTimeHero}>
          {!!dateLabel && (
            <Text numberOfLines={1} style={isRow ? styles.dateLabel : styles.dateLabelMobile}>
              {dateLabel}
            </Text>
          )}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={17} color={palette.blue} />
            <Text style={isRow ? styles.timePrimary : styles.timePrimaryMobile}>{time}</Text>
            {!!endTime && (
              <>
                <View style={styles.timeDivider} />
                <Text style={isRow ? styles.timeSecondary : styles.timeSecondaryMobile}>{endTime}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.headerSignals}>
          <StatusBadge status={status} label={statusLabel} />
          {isInteractive ? (
            <View style={styles.openSignal}>
              <Ionicons name="expand-outline" size={15} color={palette.royal} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={isRow ? styles.commandBodyRow : styles.commandBodyStack}>
        <View
          style={[
            styles.clientHero,
            burgundyRaisedStyle,
            priorityAccent ? { borderColor: `${priorityAccent}99` } : null,
          ]}
        >
          <View
            style={[
              styles.avatarShell,
              priorityAccent
                ? {
                    borderColor: priorityAccent,
                    shadowColor: priorityAccent,
                    shadowOpacity: 0.34,
                  }
                : null,
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.eyebrow}>{clientLabel}</Text>
            <View style={styles.clientNameRow}>
              <Text numberOfLines={1} style={styles.clientName}>{resolvedClient}</Text>
              <ClientPriorityBadge status={clientStatus} newLabel={newClientLabel} />
            </View>
          </View>
        </View>

        <View style={[styles.serviceHero, burgundyRaisedStyle]}>
          <View style={styles.serviceIconShell}>
            <Ionicons name={serviceIcon} size={24} color={palette.royal} />
          </View>
          <View style={styles.serviceCopy}>
            <Text numberOfLines={1} style={styles.eyebrow}>{serviceLabel}</Text>
            <Text numberOfLines={2} style={styles.serviceName}>{resolvedService}</Text>
          </View>
        </View>

        {hasMeta ? (
          <View style={styles.factRail}>
            {!!durationLabel && (
              <View style={styles.factChip}>
                <Ionicons name="hourglass-outline" size={14} color={palette.blue} />
                <Text style={styles.factTextStrong}>{durationLabel}</Text>
              </View>
            )}
            {!!priceLabel && (
              <View style={styles.factChip}>
                <Ionicons name="wallet-outline" size={14} color={palette.gold} />
                <Text style={styles.factText}>{priceLabel}</Text>
              </View>
            )}
            {!!staffName && (
              <View style={styles.factChip}>
                <Ionicons name="person-circle-outline" size={14} color={palette.royal} />
                <Text numberOfLines={1} style={styles.factText}>{staffName}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.commandFooter}>
        <View style={styles.footerCopy}>
          {!!notes ? (
            <View style={styles.notesRow}>
              <Ionicons name="document-text-outline" size={14} color={palette.textMuted} />
              <Text numberOfLines={1} style={styles.notes}>{notes}</Text>
            </View>
          ) : isInteractive ? (
            <View style={styles.tapHint}>
              <Ionicons name="scan-outline" size={13} color={palette.textMuted} />
              <Text style={styles.tapHintText}>{openAppointmentLabel}</Text>
            </View>
          ) : null}
        </View>
        {actions}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    width: "100%",
    minHeight: 224,
    borderRadius: 30,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#765EFF",
    shadowOpacity: 0.20,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
    overflow: "hidden",
  },
  cardRow: { paddingVertical: 22, paddingHorizontal: 26 },
  cardStacked: { paddingVertical: 20, paddingHorizontal: 18 },
  cardCompact: { minHeight: 176, padding: 15 },
  cardSelected: { backgroundColor: palette.surfaceSelected, borderColor: palette.borderSelected },
  cardPressed: { backgroundColor: palette.surfacePressed, borderColor: "rgba(151, 133, 255, 0.78)", transform: [{ scale: 0.997 }] },
  cardDisabled: { opacity: 0.52 },
  loadingCard: { alignItems: "center", justifyContent: "center" },

  topHighlight: { position: "absolute", top: 0, left: 26, right: 26, height: 1, backgroundColor: "rgba(224, 219, 255, 0.34)" },
  leftAccent: { position: "absolute", top: 26, bottom: 26, left: 0, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: palette.royal, opacity: 0.64 },

  commandHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },
  dateTimeHero: { flex: 1, minWidth: 0 },
  dateLabel: { marginBottom: 7, fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 1.24, color: palette.royal, textTransform: "uppercase" },
  dateLabelMobile: { marginBottom: 5, fontSize: 9, lineHeight: 13, fontWeight: "900", letterSpacing: 1.08, color: palette.royal, textTransform: "uppercase" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 9, minWidth: 0 },
  timePrimary: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: palette.textPrimary, letterSpacing: -0.4 },
  timeSecondary: { fontSize: 15, lineHeight: 20, fontWeight: "800", color: palette.textSecondary },
  timePrimaryMobile: { fontSize: 20, lineHeight: 26, fontWeight: "900", color: palette.textPrimary },
  timeSecondaryMobile: { fontSize: 13, lineHeight: 18, fontWeight: "800", color: palette.textSecondary },
  timeDivider: { width: 28, height: 1, backgroundColor: "rgba(151, 133, 255, 0.56)" },
  headerSignals: { flexDirection: "row", alignItems: "center", gap: 9 },
  openSignal: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: "rgba(139,114,255,0.32)", backgroundColor: palette.royalSoft, alignItems: "center", justifyContent: "center" },

  commandBodyRow: { marginTop: 20, flexDirection: "row", alignItems: "stretch", gap: 14 },
  commandBodyStack: { marginTop: 18, gap: 12 },
  clientHero: { flex: 1.08, minWidth: 0, minHeight: 92, flexDirection: "row", alignItems: "center", gap: 13, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: palette.borderSoft, backgroundColor: palette.surfaceInner },
  avatarShell: { width: 54, height: 54, borderRadius: 18, borderWidth: 1, borderColor: "rgba(139,114,255,0.62)", backgroundColor: "rgba(24,25,66,0.92)", alignItems: "center", justifyContent: "center", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  avatarText: { fontSize: 15, lineHeight: 20, fontWeight: "900", color: palette.textPrimary },
  identityCopy: { flex: 1, minWidth: 0, gap: 5 },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1.18, color: palette.textMuted, textTransform: "uppercase" },
  clientNameRow: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  clientName: { flexShrink: 1, fontSize: 17, lineHeight: 23, fontWeight: "900", color: palette.textPrimary },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  priorityBadgeText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8 },

  serviceHero: { flex: 1.18, minWidth: 0, minHeight: 92, flexDirection: "row", alignItems: "center", gap: 13, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: "rgba(139,114,255,0.26)", backgroundColor: "rgba(44, 39, 104, 0.52)" },
  serviceIconShell: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: "rgba(139,114,255,0.48)", backgroundColor: "rgba(139,114,255,0.16)", alignItems: "center", justifyContent: "center" },
  serviceCopy: { flex: 1, minWidth: 0, gap: 5 },
  serviceName: { fontSize: 16, lineHeight: 22, fontWeight: "900", color: palette.textPrimary },

  factRail: { minWidth: 142, justifyContent: "center", gap: 8 },
  factChip: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, borderWidth: 1, borderColor: palette.borderSoft, backgroundColor: "rgba(9,12,35,0.54)" },
  factText: { flexShrink: 1, fontSize: 10, lineHeight: 14, fontWeight: "800", color: palette.textSecondary },
  factTextStrong: { fontSize: 10, lineHeight: 14, fontWeight: "900", color: palette.blue },

  commandFooter: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: palette.borderSoft, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  footerCopy: { flex: 1, minWidth: 0 },
  notesRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  notes: { flex: 1, fontSize: 10, lineHeight: 15, fontWeight: "600", color: palette.textMuted },
  tapHint: { flexDirection: "row", alignItems: "center", gap: 6 },
  tapHintText: { fontSize: 9, lineHeight: 13, fontWeight: "800", color: palette.textMuted, letterSpacing: 0.5, textTransform: "uppercase" },

  desktopActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", marginTop: -8, marginLeft: -8 },
  mobileActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", marginTop: -8, marginLeft: -8 },
  actionButton: { minWidth: 88, minHeight: 38, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", marginLeft: 8, marginTop: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  actionButtonPressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  actionButtonLabel: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.1 },

  statusBadge: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  statusSignal: { width: 7, height: 7, borderRadius: 999, shadowOpacity: 0.70, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  statusLabel: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },

  bookingCosmicSheen: { position: "absolute", top: -78, right: -38, width: 210, height: 210, borderRadius: 999, backgroundColor: "rgba(139, 114, 255, 0.14)", opacity: 0.95 },
  bookingCosmicSheenBlue: { position: "absolute", bottom: -96, left: 54, width: 205, height: 205, borderRadius: 999, backgroundColor: "rgba(76, 160, 255, 0.08)", opacity: 0.88 },
});

// V20H_ROYAL_BOOKING_SIGNAL
// V20H_REAL_ROYAL_BOOKING_VISUAL
// V20I_BOOKING_PREMIUM_ARCHITECTURE
// V20J_BOOKING_INTELLIGENCE_CARD
// V20K_BOOKING_DETAIL_VIEW — localized open hint + view/edit separation.
export default React.memo(BookingCardV3);
