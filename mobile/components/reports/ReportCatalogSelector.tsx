import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { t } from "../../lib/i18n";
import type {
  ReportCatalogEntry,
  ReportLocale,
  ReportType,
} from "../../lib/reports/contracts";

type Props = {
  entries: ReportCatalogEntry[];
  selected: ReportType;
  locale: ReportLocale;
  onSelect: (
    reportType: ReportType,
  ) => void;
};

type ReportVisual = {
  glyph: string;
  accent: string;
  surface: string;
  glow: string;
};

const VISUALS: Record<
  ReportType,
  ReportVisual
> = {
  "daily-summary": {
    glyph: "✦",
    accent: "#F2D17A",
    surface:
      "#302765",
    glow:
      "rgba(242,209,122,0.10)",
  },

  appointments: {
    glyph: "◫",
    accent: "#67C2FF",
    surface:
      "#2D2868",
    glow:
      "rgba(103,194,255,0.10)",
  },

  "revenue-summary": {
    glyph: "◇",
    accent: "#72E0A8",
    surface:
      "#302A68",
    glow:
      "rgba(114,224,168,0.10)",
  },

  "client-summary": {
    glyph: "◎",
    accent: "#CF8CFF",
    surface:
      "#352B70",
    glow:
      "rgba(207,140,255,0.10)",
  },

  "service-performance": {
    glyph: "◆",
    accent: "#8B72FF",
    surface:
      "#372D74",
    glow:
      "rgba(139,114,255,0.11)",
  },

  "capacity-utilization": {
    glyph: "◈",
    accent: "#FF9E80",
    surface:
      "#332968",
    glow:
      "rgba(255,158,128,0.10)",
  },
};

function reportTranslationKey(
  reportType: ReportType,
): string {
  return reportType.replaceAll(
    "-",
    "_",
  );
}

export default function ReportCatalogSelector({
  entries,
  selected,
  locale,
  onSelect,
}: Props) {
  const { width } =
    useWindowDimensions();

  const cardBasis:
    | "31%"
    | "47%"
    | "100%" =
    width >= 1080
      ? "31%"
      : width >= 720
        ? "47%"
        : "100%";

  return (
    <View style={styles.grid}>
      {entries.map((entry) => {
        const active =
          entry.report_type ===
          selected;

        const visual =
          VISUALS[
            entry.report_type
          ];

        const title = t(
          entry.title_key,
          locale,
        );

        const reportKey =
          reportTranslationKey(
            entry.report_type,
          );

        const description = t(
          `reports.commandCenter.reportDescriptions.${reportKey}`,
          locale,
        );

        return (
          <Pressable
            key={entry.report_type}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{
              selected: active,
            }}
            onPress={() =>
              onSelect(
                entry.report_type,
              )
            }
            style={[
              styles.card,
              {
                flexBasis:
                  cardBasis,
                backgroundColor:
                  visual.surface,
                shadowColor:
                  visual.accent,
              },
              active && {
                borderColor:
                  visual.accent,
              },
            ]}
          >
            <View
              style={[
                styles.cosmosGlow,
                {
                  backgroundColor:
                    visual.glow,
                },
              ]}
            />

            <View
              style={[
                styles.accentLine,
                {
                  backgroundColor:
                    visual.accent,
                },
              ]}
            />

            <View style={styles.topRow}>
              <View
                style={[
                  styles.glyph,
                  {
                    borderColor:
                      `${visual.accent}66`,
                    backgroundColor:
                      `${visual.accent}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.glyphText,
                    {
                      color:
                        visual.accent,
                    },
                  ]}
                >
                  {visual.glyph}
                </Text>
              </View>

              {active ? (
                <View
                  style={[
                    styles.selectedMarker,
                    {
                      borderColor:
                        `${visual.accent}70`,
                      backgroundColor:
                        `${visual.accent}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectedText,
                      {
                        color:
                          visual.accent,
                      },
                    ]}
                  >
                    ✓
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>
              {title}
            </Text>

            <Text
              style={
                styles.description
              }
            >
              {description}
            </Text>

            <View style={styles.badges}>
              <View
                style={styles.badge}
              >
                <Text
                  style={
                    styles.badgeText
                  }
                >
                  {entry.period ===
                  "single_calendar_date"
                    ? t(
                        "reports.commandCenter.singleDay",
                        locale,
                      )
                    : t(
                        "reports.commandCenter.dateRange",
                        locale,
                      )}
                </Text>
              </View>

              <View
                style={styles.badge}
              >
                <Text
                  style={
                    styles.badgeText
                  }
                >
                  {entry.currency_mode ===
                  "required_fiat"
                    ? t(
                        "reports.commandCenter.currencyRequired",
                        locale,
                      )
                    : t(
                        "reports.commandCenter.noCurrency",
                        locale,
                      )}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  card: {
    minWidth: 0,
    flexGrow: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor:
      "rgba(150,132,255,0.48)",
    padding: 18,

    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 9,
    },

    elevation: 9,
  },

  cosmosGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -56,
    top: -62,
  },

  accentLine: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 999,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 15,
  },

  glyph: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  glyphText: {
    fontSize: 20,
    fontWeight: "900",
  },

  selectedMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedText: {
    fontSize: 13,
    fontWeight: "900",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.35,
    marginBottom: 7,
  },

  description: {
    color: "#B6B1C7",
    fontSize: 12,
    lineHeight: 18,
    minHeight: 54,
  },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 14,
  },

  badge: {
    backgroundColor:
      "rgba(255,255,255,0.055)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  badgeText: {
    color: "#DDD9E8",
    fontSize: 9,
    fontWeight: "800",
  },
});
