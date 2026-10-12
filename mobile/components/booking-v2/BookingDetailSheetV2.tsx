import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";

import type {
  BookingCardV2Props,
  BookingStatus,
} from "./BookingCardV2";

export type BookingDetailLayout = "panel" | "sheet";

export interface BookingDetailSheetV2Props {
  visible: boolean;
  onRequestClose: () => void;
  layout: BookingDetailLayout;

  title: string;
  subtitle?: string;
  closeLabel: string;

  clientLabel: string;
  serviceLabel: string;
  bookingTimeLabel: string;
  notesLabel: string;
  priceLabel: string;
  newClientLabel: string;

  item: BookingCardV2Props | null;
}

const colors = {
  textPrimary: "#FFFDFD",
  textSecondary: "#D7D3E7",
  textMuted: "#938DAA",
  royal: "#9A7CFF",
  blue: "#67C2FF",
  green: "#47D69A",
  danger: "#F36D84",
  gold: "#E8C97A",
  surface: "rgba(7, 9, 28, 0.90)",
  raised: "rgba(29, 29, 72, 0.72)",
  border: "rgba(164, 142, 255, 0.34)",
  borderStrong: "rgba(172, 151, 255, 0.62)",
} as const;

function statusColor(status: BookingStatus): string {
  if (status === "completed") return colors.green;
  if (status === "cancelled") return colors.danger;
  return colors.blue;
}

function initials(value?: string): string {
  const parts = (value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.length
    ? parts.map((part) => part[0]?.toUpperCase() || "").join("")
    : "•";
}

function priorityLabel(
  status: BookingCardV2Props["clientStatus"],
  newClientLabel: string,
): string | undefined {
  if (status === "vip") return "VIP";
  if (status === "new") return newClientLabel;
  return undefined;
}

export default function BookingDetailSheetV2({
  visible,
  onRequestClose,
  layout,
  title,
  subtitle,
  closeLabel,
  clientLabel,
  serviceLabel,
  bookingTimeLabel,
  notesLabel,
  priceLabel,
  newClientLabel,
  item,
}: BookingDetailSheetV2Props) {
  const { theme } = useDashboardTheme();

  if (!item) return null;

  const isPanel = layout === "panel";
  const tone = statusColor(item.status);
  const priority = priorityLabel(item.clientStatus, newClientLabel);
  const priorityTone =
    item.clientStatus === "vip"
      ? colors.gold
      : item.clientStatus === "new"
        ? colors.blue
        : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, !isPanel && styles.overlaySheet]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.commandPanel,
            isPanel ? styles.commandPanelDesktop : styles.commandPanelMobile,
            {
              borderColor: theme.palette.borderStrong,
              shadowColor: theme.palette.royal,
            },
          ]}
        >
          <View pointerEvents="none" style={styles.cosmicOrb} />
          <View pointerEvents="none" style={styles.cosmicOrbBlue} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
                onPress={onRequestClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    borderColor: `${tone}66`,
                    backgroundColor: `${tone}18`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: tone,
                      shadowColor: tone,
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: tone }]}>
                  {item.statusLabel}
                </Text>
              </View>

              {!!priority && !!priorityTone && (
                <View
                  style={[
                    styles.priorityPill,
                    {
                      borderColor: `${priorityTone}99`,
                      backgroundColor: `${priorityTone}18`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      item.clientStatus === "vip"
                        ? "diamond-outline"
                        : "sparkles-outline"
                    }
                    size={13}
                    color={priorityTone}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: priorityTone },
                    ]}
                  >
                    {priority}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.heroGrid}>
              <View style={styles.heroCard}>
                <View
                  style={[
                    styles.avatar,
                    priorityTone
                      ? {
                          borderColor: priorityTone,
                          shadowColor: priorityTone,
                          shadowOpacity: 0.34,
                        }
                      : null,
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {initials(item.clientName || item.clientFallbackLabel)}
                  </Text>
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.eyebrow}>{clientLabel}</Text>
                  <Text style={styles.heroValue}>
                    {item.clientName || item.clientFallbackLabel || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.heroCard}>
                <View style={styles.serviceIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={23}
                    color={colors.royal}
                  />
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.eyebrow}>{serviceLabel}</Text>
                  <Text style={styles.heroValue}>
                    {item.serviceName || item.serviceFallbackLabel || "—"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeading}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={colors.blue}
                />
                <Text style={styles.eyebrow}>{bookingTimeLabel}</Text>
              </View>

              {!!item.dateLabel && (
                <Text style={styles.dateLabel}>{item.dateLabel}</Text>
              )}

              <View style={styles.timeLine}>
                <Text style={styles.timePrimary}>{item.time}</Text>
                {!!item.endTime && (
                  <>
                    <View style={styles.timeDivider} />
                    <Text style={styles.timeSecondary}>
                      {item.endTime}
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.factRow}>
                {!!item.durationLabel && (
                  <View style={styles.factChip}>
                    <Ionicons
                      name="hourglass-outline"
                      size={14}
                      color={colors.blue}
                    />
                    <Text style={styles.factText}>
                      {item.durationLabel}
                    </Text>
                  </View>
                )}

                {!!item.priceLabel && (
                  <View style={styles.factChip}>
                    <Ionicons
                      name="wallet-outline"
                      size={14}
                      color={colors.gold}
                    />
                    <Text style={styles.factText}>
                      {priceLabel}: {item.priceLabel}
                    </Text>
                  </View>
                )}

                {!!item.staffName && (
                  <View style={styles.factChip}>
                    <Ionicons
                      name="person-circle-outline"
                      size={14}
                      color={colors.royal}
                    />
                    <Text style={styles.factText}>
                      {item.staffName}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!!item.notes && (
              <View style={styles.notesCard}>
                <View style={styles.scheduleHeading}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={colors.royal}
                  />
                  <Text style={styles.eyebrow}>{notesLabel}</Text>
                </View>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={onRequestClose}
              style={({ pressed }) => [
                styles.closeAction,
                {
                  borderColor: theme.palette.borderStrong,
                  backgroundColor: theme.palette.surfaceRaised,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeActionText}>{closeLabel}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(2, 3, 14, 0.70)",
  },
  overlaySheet: {
    justifyContent: "flex-end",
    padding: 0,
  },
  commandPanel: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: colors.surface,
    shadowOpacity: 0.42,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 22 },
    elevation: 22,
  },
  commandPanelDesktop: {
    maxWidth: 760,
    maxHeight: "86%",
    borderRadius: 32,
  },
  commandPanelMobile: {
    maxHeight: "90%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  cosmicOrb: {
    position: "absolute",
    top: -92,
    right: -58,
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(139, 114, 255, 0.22)",
  },
  cosmicOrbBlue: {
    position: "absolute",
    bottom: -120,
    left: -46,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(76, 160, 255, 0.11)",
  },
  content: {
    padding: 24,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(14, 16, 43, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
  },
  statusPill: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    shadowOpacity: 0.78,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  priorityPill: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroCard: {
    flex: 1,
    minWidth: 250,
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.raised,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(20, 21, 58, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(154, 124, 255, 0.52)",
    backgroundColor: "rgba(154, 124, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    letterSpacing: 1.12,
    textTransform: "uppercase",
  },
  heroValue: {
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  scheduleCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(13, 16, 43, 0.78)",
  },
  scheduleHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateLabel: {
    marginTop: 12,
    color: colors.royal,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.08,
    textTransform: "uppercase",
  },
  timeLine: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timePrimary: {
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },
  timeSecondary: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  timeDivider: {
    width: 34,
    height: 1,
    backgroundColor: "rgba(154, 124, 255, 0.60)",
  },
  factRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  factChip: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(8, 10, 30, 0.58)",
  },
  factText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  notesCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(13, 16, 43, 0.72)",
  },
  notesText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
  },
  closeAction: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
  },
  closeActionText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
});
