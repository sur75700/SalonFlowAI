import React, {
  useState,
} from "react";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { t } from "../../lib/i18n";

import type {
  ReportFormat,
  ReportLocale,
} from "../../lib/reports/contracts";

type Props = {
  visible: boolean;
  formats: ReportFormat[];
  reportTitle: string;
  locale: ReportLocale;
  onClose: () => void;
  onExport: (
    format: ReportFormat,
  ) => Promise<boolean>;
};

type FormatVisual = {
  glyph: string;
  accent: string;
  surface: string;
};

const FORMAT_VISUALS: Record<
  ReportFormat,
  FormatVisual
> = {
  pdf: {
    glyph: "P",
    accent: "#FF7F7F",
    surface:
      "#2E2759",
  },

  txt: {
    glyph: "T",
    accent: "#67C2FF",
    surface:
      "#2D285F",
  },

  csv: {
    glyph: "C",
    accent: "#72E0A8",
    surface:
      "#2F2A61",
  },

  xlsx: {
    glyph: "X",
    accent: "#83E09E",
    surface:
      "#302B62",
  },

  docx: {
    glyph: "D",
    accent: "#8B9CFF",
    surface:
      "#322A68",
  },
};

export default function ReportExportSheet({
  visible,
  formats,
  reportTitle,
  locale,
  onClose,
  onExport,
}: Props) {
  const [
    busyFormat,
    setBusyFormat,
  ] = useState<ReportFormat | null>(
    null,
  );

  const exportFormat = async (
    format: ReportFormat,
  ) => {
    if (busyFormat) return;

    try {
      setBusyFormat(format);

      const succeeded =
        await onExport(format);

      if (succeeded) {
        onClose();
      }
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={
            StyleSheet.absoluteFill
          }
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t(
            "reports.commandCenter.close",
            locale,
          )}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View
              style={styles.headerCopy}
            >
              <Text
                style={styles.overline}
              >
                {t(
                  "reports.commandCenter.exportOverline",
                  locale,
                )}
              </Text>

              <Text style={styles.title}>
                {reportTitle}
              </Text>

              <Text
                style={styles.subtitle}
              >
                {t(
                  "reports.commandCenter.exportSubtitle",
                  locale,
                )}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                "reports.commandCenter.close",
                locale,
              )}
              onPress={onClose}
              style={
                styles.closeButton
              }
            >
              <Text
                style={styles.closeText}
              >
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={
              styles.formats
            }
          >
            {formats.map((format) => {
              const busy =
                busyFormat === format;

              const visual =
                FORMAT_VISUALS[format];

              return (
                <Pressable
                  key={format}
                  accessibilityRole="button"
                  disabled={Boolean(
                    busyFormat,
                  )}
                  onPress={() =>
                    exportFormat(format)
                  }
                  style={[
                    styles.formatCard,
                    {
                      backgroundColor:
                        visual.surface,
                    },
                    busy && {
                      borderColor:
                        visual.accent,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.formatGlyph,
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
                        styles.formatGlyphText,
                        {
                          color:
                            visual.accent,
                        },
                      ]}
                    >
                      {visual.glyph}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.formatCopy
                    }
                  >
                    <Text
                      style={
                        styles.formatName
                      }
                    >
                      {format.toUpperCase()}
                    </Text>

                    <Text
                      style={
                        styles.formatDescription
                      }
                    >
                      {t(
                        `reports.commandCenter.formatDescriptions.${format}`,
                        locale,
                      )}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.formatMeta,
                      {
                        color:
                          visual.accent,
                      },
                    ]}
                  >
                    {busy
                      ? t(
                          "reports.commandCenter.preparingExport",
                          locale,
                        )
                      : t(
                          "reports.commandCenter.downloadShare",
                          locale,
                        )}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(2,3,13,0.80)",
  },

  sheet: {
    maxHeight: "86%",

    backgroundColor:
      "#151238",

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.40)",

    padding: 20,

    shadowColor: "#8B72FF",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: -8,
    },

    elevation: 20,
  },

  handle: {
    alignSelf: "center",

    width: 42,
    height: 4,
    borderRadius: 999,

    backgroundColor:
      "rgba(255,255,255,0.16)",

    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 16,
    marginBottom: 18,
  },

  headerCopy: {
    flex: 1,
  },

  overline: {
    color: "#B8A7FF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 7,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  subtitle: {
    color: "#AAA7C0",
    fontSize: 12,
    lineHeight: 18,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.06)",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
  },

  closeText: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 27,
  },

  formats: {
    gap: 10,
    paddingBottom: 12,
  },

  formatCard: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.09)",

    borderRadius: 20,
    padding: 14,
  },

  formatGlyph: {
    width: 42,
    height: 42,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
  },

  formatGlyphText: {
    fontSize: 14,
    fontWeight: "900",
  },

  formatCopy: {
    flex: 1,
    minWidth: 0,
  },

  formatName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 3,
  },

  formatDescription: {
    color: "#A39EAF",
    fontSize: 10,
    lineHeight: 15,
  },

  formatMeta: {
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "900",
    textAlign: "right",
    maxWidth: 92,
  },
});
