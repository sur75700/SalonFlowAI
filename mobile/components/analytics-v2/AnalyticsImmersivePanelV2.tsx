import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import DashboardThemeBackground from "../dashboard-v2/cloud/DashboardThemeBackground";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { analyticsV2SurfaceT } from "./analytics-v2-i18n";
import type {
  AnalyticsPreviewModel,
  AnalyticsServicePreview,
  AnalyticsStatusPreview,
} from "./analytics-v2-types";

type ImmersiveKind =
  | "booking-status"
  | "top-services"
  | "client-health"
  | "demand-heatmap";

type ClientSignal =
  AnalyticsPreviewModel["clientSignals"][number];

type ToneVisual = {
  accent: string;
  soft: string;
  border: string;
};

const TONE_MAP: Record<string, ToneVisual> = {
  emerald: {
    accent: "#39F5A6",
    soft: "rgba(57,245,166,0.10)",
    border: "rgba(57,245,166,0.24)",
  },
  violet: {
    accent: "#9B8CFF",
    soft: "rgba(155,140,255,0.12)",
    border: "rgba(155,140,255,0.28)",
  },
  cyan: {
    accent: "#58D8FF",
    soft: "rgba(88,216,255,0.11)",
    border: "rgba(88,216,255,0.26)",
  },
  gold: {
    accent: "#F4D47D",
    soft: "rgba(244,212,125,0.11)",
    border: "rgba(244,212,125,0.26)",
  },
  rose: {
    accent: "#FF829E",
    soft: "rgba(255,130,158,0.11)",
    border: "rgba(255,130,158,0.26)",
  },
};

const FALLBACK_TONE = TONE_MAP.violet;

function toneFor(value: string): ToneVisual {
  return TONE_MAP[value] ?? FALLBACK_TONE;
}

function useImmersiveT() {
  const { locale } = useAppPreferences();

  return (
    source: string,
    params: Record<string, string | number> = {}
  ) => analyticsV2SurfaceT(locale, source, params);
}

type Props = {
  kind: ImmersiveKind;
  overline: string;
  title: string;
  subtitle: string;
  openLabel: string;
  closeLabel: string;

  statuses?: AnalyticsStatusPreview[];
  services?: AnalyticsServicePreview[];
  clientSignals?: ClientSignal[];
  heatmap?: number[][];
};

function StatusInstrument({
  statuses,
}: {
  statuses: AnalyticsStatusPreview[];
}) {
  const t = useImmersiveT();
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const total = useMemo(
    () =>
      statuses.reduce(
        (sum, item) => sum + item.value,
        0
      ),
    [statuses]
  );

  const dominantStatus = useMemo(
    () =>
      statuses.reduce<AnalyticsStatusPreview | null>(
        (best, item) =>
          item.value > 0 &&
          (!best || item.value > best.value)
            ? item
            : best,
        null
      ),
    [statuses]
  );

  const selected =
    statuses.find((item) => item.id === selectedId) ??
    dominantStatus ??
    statuses[0] ??
    null;

  const selectedPercent =
    selected && total > 0
      ? Math.round((selected.value / total) * 100)
      : 0;

  const radius = 98;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={styles.statusStage}>
      <View style={styles.largeRingWrap}>
        <Svg
          width={268}
          height={268}
          viewBox="0 0 268 268"
        >
          <Circle
            cx={134}
            cy={134}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={18}
          />

          <G transform="rotate(-90 134 134)">
            {statuses.map((status) => {
              const length =
                total > 0
                  ? (status.value / total) *
                    circumference
                  : 0;

              const currentOffset = offset;
              offset += length;

              const active =
                selected?.id === status.id;

              if (length <= 0) {
                return null;
              }

              return (
                <Circle
                  key={status.id}
                  cx={134}
                  cy={134}
                  r={radius}
                  fill="none"
                  stroke={toneFor(status.tone).accent}
                  strokeWidth={active ? 22 : 18}
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(
                    length - 5,
                    0
                  )} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  opacity={active ? 1 : 0.72}
                  onPress={() =>
                    setSelectedId(status.id)
                  }
                />
              );
            })}
          </G>
        </Svg>

        <View style={styles.largeRingCenter}>
          <Text style={styles.largeMetric}>
            {selected?.value ?? total}
          </Text>
          <Text style={styles.largeMetricCaption}>
            {selected?.label ?? t("Bookings")}
          </Text>
        </View>
      </View>

      <View style={styles.selectionList}>
        {statuses.map((status) => {
          const tone = toneFor(status.tone);
          const percent =
            total > 0
              ? Math.round(
                  (status.value / total) * 100
                )
              : 0;

          const active =
            selected?.id === status.id;

          return (
            <Pressable
              key={status.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${status.label}: ${status.value}, ${percent}%`}
              onHoverIn={() =>
                setSelectedId(status.id)
              }
              onPressIn={() =>
                setSelectedId(status.id)
              }
              onPress={() =>
                setSelectedId(status.id)
              }
              style={({ pressed }) => [
                styles.selectionRow,
                {
                  borderColor: active
                    ? tone.accent
                    : tone.border,
                  backgroundColor: active
                    ? tone.soft
                    : "rgba(255,255,255,0.035)",
                },
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.signalDot,
                  { backgroundColor: tone.accent },
                ]}
              />

              <View style={styles.selectionCopy}>
                <Text style={styles.selectionTitle}>
                  {status.label}
                </Text>
                <Text style={styles.selectionHint}>
                  {percent}% · {status.value}
                </Text>
              </View>

              <Ionicons
                name={
                  active
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={18}
                color={tone.accent}
              />
            </Pressable>
          );
        })}

        {selected ? (
          <View style={[styles.readout, styles.statusReadout]}>
            <Text style={styles.readoutEyebrow}>
              {t("SELECTED STATUS")}
            </Text>
            <Text style={styles.readoutValue}>
              {selected.label} · {selectedPercent}%
            </Text>
            <Text style={styles.readoutHint}>
              {t(
                "This status represents {percent}% of {total} bookings in the selected period.",
                {
                  percent: selectedPercent,
                  total,
                }
              )}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ServiceInstrument({
  services,
}: {
  services: AnalyticsServicePreview[];
}) {
  const t = useImmersiveT();
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const selected =
    services.find((item) => item.id === selectedId) ??
    services[0] ??
    null;

  return (
    <View style={styles.instrumentStack}>
      {services.map((service, index) => {
        const tone = toneFor(service.tone);
        const active =
          selected?.id === service.id;

        return (
          <Pressable
            key={service.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${service.name}: ${service.revenue}`}
            onHoverIn={() =>
              setSelectedId(service.id)
            }
            onPressIn={() =>
              setSelectedId(service.id)
            }
            onPress={() =>
              setSelectedId(service.id)
            }
            style={({ pressed }) => [
              styles.serviceRow,
              {
                borderColor: active
                  ? tone.accent
                  : tone.border,
                backgroundColor: active
                  ? tone.soft
                  : "rgba(255,255,255,0.035)",
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>
                {index + 1}
              </Text>
            </View>

            <View style={styles.serviceMain}>
              <View style={styles.serviceTitleRow}>
                <Text
                  style={styles.selectionTitle}
                  numberOfLines={1}
                >
                  {service.name}
                </Text>

                <Text
                  style={[
                    styles.serviceRevenue,
                    { color: tone.accent },
                  ]}
                >
                  {service.revenue}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(service.share, 100)
                      )}%`,
                      backgroundColor: tone.accent,
                    },
                  ]}
                />
              </View>

              <Text style={styles.selectionHint}>
                {t(
                  "{count} bookings · {share}% of busiest-service booking volume",
                  {
                    count: service.bookings,
                    share: service.share,
                  }
                )}
              </Text>
            </View>
          </Pressable>
        );
      })}

      {selected ? (
        <View style={styles.readout}>
          <Text style={styles.readoutEyebrow}>
            {t("SELECTED SERVICE")}
          </Text>
          <Text style={styles.readoutValue}>
            {selected.name}
          </Text>
          <Text style={styles.readoutHint}>
            {t(
              "{revenue} · {count} bookings · {share}% of busiest-service booking volume",
              {
                revenue: selected.revenue,
                count: selected.bookings,
                share: selected.share,
              }
            )}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ClientInstrument({
  clientSignals,
}: {
  clientSignals: ClientSignal[];
}) {
  const t = useImmersiveT();
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const selected =
    clientSignals.find(
      (item) => item.id === selectedId
    ) ??
    clientSignals[0] ??
    null;

  const selectedExplanation =
    selected?.id === "retention"
      ? t(
          "Share of active clients in this period who also had earlier activity."
        )
      : selected?.id === "new"
        ? t(
            "Clients created or first seen during the selected period."
          )
        : selected?.id === "at-risk"
          ? t(
              "Clients with a completed appointment in the previous period but none in this period."
            )
          : selected?.id === "high-value"
            ? t(
                "Clients whose completed revenue is at least twice the current average ticket."
              )
            : selected?.hint ?? "";

  return (
    <View>
      <View style={styles.clientGrid}>
        {clientSignals.map((signal) => {
          const tone = toneFor(signal.tone);
          const active =
            selected?.id === signal.id;

          return (
            <Pressable
              key={signal.id}
              accessibilityRole="button"
              accessibilityState={{
                selected: active,
              }}
              accessibilityLabel={`${signal.label}: ${signal.value}`}
              onHoverIn={() =>
                setSelectedId(signal.id)
              }
              onPressIn={() =>
                setSelectedId(signal.id)
              }
              onPress={() =>
                setSelectedId(signal.id)
              }
              style={({ pressed }) => [
                styles.clientCard,
                {
                  borderColor: active
                    ? tone.accent
                    : tone.border,
                  backgroundColor: active
                    ? tone.soft
                    : "rgba(255,255,255,0.035)",
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.clientValue,
                  { color: tone.accent },
                ]}
              >
                {signal.value}
              </Text>

              <Text style={styles.selectionTitle}>
                {signal.label}
              </Text>

              <Text style={styles.selectionHint}>
                {signal.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.readout}>
          <Text style={styles.readoutEyebrow}>
            {t("SELECTED CLIENT SIGNAL")}
          </Text>
          <Text style={styles.readoutValue}>
            {selected.label} · {selected.value}
          </Text>
          <Text style={styles.readoutHint}>
            {selectedExplanation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function HeatmapInstrument({
  rows,
}: {
  rows: number[][];
}) {
  const t = useImmersiveT();
  const { width } = useWindowDimensions();

  const days = [
    t("Mon"),
    t("Tue"),
    t("Wed"),
    t("Thu"),
    t("Fri"),
    t("Sat"),
    t("Sun"),
  ];

  const hours = [
    "09",
    "11",
    "13",
    "15",
    "17",
    "19",
  ];

  const cellWidth =
    width >= 1100 ? 124 : width >= 820 ? 96 : 74;
  const cellHeight =
    width >= 900 ? 60 : 52;

  const hottestCell = useMemo(() => {
    let best: {
      row: number;
      column: number;
      value: number;
    } | null = null;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];

      for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
        const value = row[columnIndex];

        if (!best || value > best.value) {
          best = {
            row: rowIndex,
            column: columnIndex,
            value,
          };
        }
      }
    }

    return best;
  }, [rows]);

  const [selectedCell, setSelectedCell] =
    useState<{
      row: number;
      column: number;
    } | null>(null);

  const backgroundFor = (intensity: number) =>
    intensity >= 5
      ? "rgba(155,140,255,0.95)"
      : intensity === 4
        ? "rgba(155,140,255,0.68)"
        : intensity === 3
          ? "rgba(88,216,255,0.47)"
          : intensity === 2
            ? "rgba(88,216,255,0.27)"
            : "rgba(255,255,255,0.07)";

  const resolvedSelectedCell =
    selectedCell ??
    (hottestCell
      ? {
          row: hottestCell.row,
          column: hottestCell.column,
        }
      : null);

  const selectedIntensity =
    resolvedSelectedCell
      ? rows[resolvedSelectedCell.row]?.[
          resolvedSelectedCell.column
        ]
      : null;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.heatmapScrollContent
        }
      >
        <View
          style={[
            styles.heatmapStage,
            {
              minWidth:
                58 +
                hours.length * (cellWidth + 8),
            },
          ]}
        >
          <View style={styles.heatmapHeader}>
            <View style={styles.heatmapDayLabel} />

            {hours.map((hour) => (
              <Text
                key={hour}
                style={[
                  styles.heatmapHour,
                  { width: cellWidth },
                ]}
              >
                {hour}
              </Text>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View
              key={days[rowIndex] ?? String(rowIndex)}
              style={styles.heatmapRow}
            >
              <Text style={styles.heatmapDayLabel}>
                {days[rowIndex] ?? `D${rowIndex + 1}`}
              </Text>

              {row.map(
                (intensity, columnIndex) => {
                  const active =
                    resolvedSelectedCell?.row ===
                      rowIndex &&
                    resolvedSelectedCell?.column ===
                      columnIndex;

                  const day =
                    days[rowIndex] ??
                    `D${rowIndex + 1}`;

                  const hour =
                    hours[columnIndex] ??
                    String(columnIndex);

                  const selectCell = () =>
                    setSelectedCell({
                      row: rowIndex,
                      column: columnIndex,
                    });

                  return (
                    <Pressable
                      key={`${rowIndex}-${columnIndex}`}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: active,
                      }}
                      accessibilityLabel={`${day} ${hour}:00 · ${intensity}/5`}
                      onHoverIn={selectCell}
                      onPressIn={selectCell}
                      onPress={selectCell}
                      style={({ pressed }) => [
                        styles.heatCell,
                        {
                          width: cellWidth,
                          height: cellHeight,
                          backgroundColor:
                            backgroundFor(
                              intensity
                            ),
                          borderColor: active
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.08)",
                        },
                        active &&
                          styles.heatCellSelected,
                        pressed && styles.pressed,
                      ]}
                    />
                  );
                }
              )}
            </View>
          ))}

          <View style={styles.heatLegend}>
            <Text style={styles.heatLegendLabel}>
              {t("Low")}
            </Text>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.heatLegendSwatch,
                  { backgroundColor: backgroundFor(level) },
                ]}
              />
            ))}
            <Text style={styles.heatLegendLabel}>
              {t("High")}
            </Text>
          </View>
        </View>
      </ScrollView>

      {resolvedSelectedCell &&
      selectedIntensity !== null &&
      selectedIntensity !== undefined ? (
        <View style={styles.readout}>
          <Text style={styles.readoutEyebrow}>
            {t("SELECTED DEMAND WINDOW")}
          </Text>
          <Text style={styles.readoutValue}>
            {days[resolvedSelectedCell.row] ??
              `D${resolvedSelectedCell.row + 1}`}{" "}
            ·{" "}
            {hours[resolvedSelectedCell.column] ??
              resolvedSelectedCell.column}
            :00
          </Text>
          <Text style={styles.readoutHint}>
            {t("Demand intensity: {value}/5", {
              value: selectedIntensity,
            })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AnalyticsImmersivePanelV2({
  kind,
  overline,
  title,
  subtitle,
  openLabel,
  closeLabel,
  statuses = [],
  services = [],
  clientSignals = [],
  heatmap = [],
}: Props) {
  const [visible, setVisible] = useState(false);
  const { width } = useWindowDimensions();

  const wide = width >= 900;

  const content = (() => {
    if (kind === "booking-status") {
      return (
        <StatusInstrument statuses={statuses} />
      );
    }

    if (kind === "top-services") {
      return (
        <ServiceInstrument services={services} />
      );
    }

    if (kind === "client-health") {
      return (
        <ClientInstrument
          clientSignals={clientSignals}
        />
      );
    }

    return (
      <HeatmapInstrument rows={heatmap} />
    );
  })();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={openLabel}
        accessibilityHint={subtitle}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.expandButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="expand-outline"
          size={18}
          color="#F6F3FF"
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <DashboardThemeBackground
          style={styles.modalRoot}
        >
          <SafeAreaView
            style={styles.safeArea}
            accessibilityViewIsModal
          >
            <View
              style={[
                styles.modalShell,
                wide && styles.modalShellWide,
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.overline}>
                    {overline}
                  </Text>

                  <Text style={styles.title}>
                    {title}
                  </Text>

                  <Text style={styles.subtitle}>
                    {subtitle}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={closeLabel}
                  onPress={() =>
                    setVisible(false)
                  }
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={
                  styles.content
                }
                showsVerticalScrollIndicator={false}
              >
                {content}
              </ScrollView>
            </View>
          </SafeAreaView>
        </DashboardThemeBackground>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 14,
  },
  modalShell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(7, 11, 32, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(161, 145, 255, 0.28)",
  },
  modalShellWide: {
    maxWidth: 1180,
  },
  modalHeader: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17, 21, 54, 0.54)",
  },
  modalHeaderCopy: {
    flex: 1,
  },
  overline: {
    color: "#9B8CFF",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(221,226,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(155,140,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(155,140,255,0.32)",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pressed: {
    opacity: 0.76,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 22,
    gap: 18,
  },
  statusStage: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  largeRingWrap: {
    width: 268,
    height: 268,
    alignItems: "center",
    justifyContent: "center",
  },
  largeRingCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 158,
  },
  largeMetric: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
  },
  largeMetricCaption: {
    marginTop: 4,
    color: "rgba(220,225,255,0.66)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  selectionList: {
    flex: 1,
    minWidth: 260,
    gap: 10,
  },
  statusReadout: {
    marginTop: 4,
  },

  selectionRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  signalDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  selectionCopy: {
    flex: 1,
  },
  selectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  selectionHint: {
    marginTop: 4,
    color: "rgba(220,225,255,0.65)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  instrumentStack: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    gap: 12,
  },
  serviceRow: {
    width: "100%",
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  rankText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  serviceMain: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  serviceRevenue: {
    fontSize: 15,
    fontWeight: "900",
  },
  progressTrack: {
    height: 6,
    marginTop: 11,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  clientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  clientCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 230,
    minHeight: 130,
    padding: 17,
    borderRadius: 20,
    borderWidth: 1,
  },
  clientValue: {
    fontSize: 27,
    fontWeight: "900",
  },
  readout: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(155,140,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(155,140,255,0.23)",
  },
  readoutEyebrow: {
    color: "#9B8CFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  readoutValue: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },
  readoutHint: {
    marginTop: 7,
    color: "rgba(221,226,255,0.70)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  heatmapScrollContent: {
    flexGrow: 1,
  },
  heatmapStage: {
    minWidth: 650,
    flex: 1,
    alignSelf: "center",
  },
  heatmapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  heatmapDayLabel: {
    width: 50,
    color: "rgba(221,226,255,0.66)",
    fontSize: 11,
    fontWeight: "800",
  },
  heatmapHour: {
    width: 78,
    textAlign: "center",
    color: "rgba(221,226,255,0.55)",
    fontSize: 11,
    fontWeight: "800",
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  heatCell: {
    width: 78,
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
  },
  heatLegend: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
  },
  heatLegendLabel: {
    color: "rgba(221,226,255,0.62)",
    fontSize: 11,
    fontWeight: "800",
  },
  heatLegendSwatch: {
    width: 22,
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heatCellSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.03 }],
  },
});
