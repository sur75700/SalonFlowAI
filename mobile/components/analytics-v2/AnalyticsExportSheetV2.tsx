import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { analyticsV2SurfaceT } from "./analytics-v2-i18n";
import type {
  AnalyticsPreviewModel,
} from "./analytics-v2-types";

type ExportFormat = "report" | "csv";

type ExportSectionKey =
  | "overview"
  | "revenue"
  | "clients"
  | "services"
  | "operations"
  | "ai";

type Props = {
  visible: boolean;
  model: AnalyticsPreviewModel;
  periodLabel: string;
  dataMode?: "preview" | "live";
  onClose: () => void;
};

const SECTION_OPTIONS: {
  key: ExportSectionKey;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    key: "overview",
    label: "Executive Overview",
    description: "KPIs and business-health summary",
    icon: "grid-outline",
  },
  {
    key: "revenue",
    label: "Revenue Intelligence",
    description: "Trend and period comparison",
    icon: "cash-outline",
  },
  {
    key: "clients",
    label: "Client Intelligence",
    description: "Retention and risk signals",
    icon: "people-outline",
  },
  {
    key: "services",
    label: "Service Intelligence",
    description: "Demand and revenue rankings",
    icon: "diamond-outline",
  },
  {
    key: "operations",
    label: "Operations",
    description: "Booking-status composition",
    icon: "pulse-outline",
  },
  {
    key: "ai",
    label: "AI Actions",
    description: "Recommendations and opportunities",
    icon: "sparkles-outline",
  },
];

const COLORS = {
  text: "#F7F8FF",
  secondary: "#AAB3CA",
  muted: "#75809A",
  violet: "#8C7CFF",
  emerald: "#39F5A6",
  cyan: "#58D8FF",
  gold: "#FFD36A",
  border: "rgba(255,255,255,0.09)",
} as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeCsv(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildCsv(
  model: AnalyticsPreviewModel,
  sections: Record<ExportSectionKey, boolean>,
  locale: string | null | undefined
): string {
  const t = (
    source: string,
    params: Record<string, string | number> = {}
  ) => analyticsV2SurfaceT(locale, source, params);

  const rows: string[][] = [
    [
      t("Section"),
      t("Metric"),
      t("Value"),
      t("Context"),
    ],
  ];

  if (sections.overview) {
    model.kpis.forEach((item) => {
      rows.push([
        t("Overview"),
        item.label,
        item.value,
        `${item.delta} · ${item.context}`,
      ]);
    });

    rows.push([
      t("Overview"),
      t("Salon Health Index"),
      `${model.aiScore}/100`,
      model.primarySignal,
    ]);
  }

  if (sections.revenue) {
    model.revenueSeries.forEach((item) => {
      rows.push([
        t("Revenue"),
        item.label,
        String(item.current),
        t("Previous: {value}", { value: item.previous }),
      ]);
    });
  }

  if (sections.clients) {
    model.clientSignals.forEach((item) => {
      rows.push([
        t("Clients"),
        item.label,
        item.value,
        item.hint,
      ]);
    });
  }

  if (sections.services) {
    model.services.forEach((item) => {
      rows.push([
        t("Services"),
        item.name,
        item.revenue,
        t("{count} bookings · {share}% demand", { count: item.bookings, share: item.share }),
      ]);
    });
  }

  if (sections.operations) {
    model.statuses.forEach((item) => {
      rows.push([
        t("Operations"),
        item.label,
        String(item.value),
        t("Booking status"),
      ]);
    });
  }

  if (sections.ai) {
    model.actions.forEach((item) => {
      rows.push([
        t("AI Actions"),
        item.title,
        item.impact,
        t("{priority} · {confidence}% confidence", { priority: item.priority, confidence: item.confidence }),
      ]);
    });
  }

  return rows
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function buildHtml(
  model: AnalyticsPreviewModel,
  periodLabel: string,
  sections: Record<ExportSectionKey, boolean>,
  dataMode: "preview" | "live",
  locale: string | null | undefined
): string {
  const t = (
    source: string,
    params: Record<string, string | number> = {}
  ) => analyticsV2SurfaceT(locale, source, params);
  const kpis = sections.overview
    ? model.kpis
        .map(
          (item) => `
            <article class="metric">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
              <small>${escapeHtml(item.delta)} · ${escapeHtml(item.context)}</small>
            </article>
          `
        )
        .join("")
    : "";

  const services = sections.services
    ? model.services
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.name)}</td>
              <td>${escapeHtml(item.revenue)}</td>
              <td>${item.bookings}</td>
              <td>${item.share}%</td>
            </tr>
          `
        )
        .join("")
    : "";

  const clients = sections.clients
    ? model.clientSignals
        .map(
          (item) => `
            <article class="signal">
              <strong>${escapeHtml(item.value)}</strong>
              <span>${escapeHtml(item.label)}</span>
              <small>${escapeHtml(item.hint)}</small>
            </article>
          `
        )
        .join("")
    : "";

  const actions = sections.ai
    ? model.actions
        .map(
          (item) => `
            <article class="action">
              <span>${escapeHtml(item.priority)} · ${item.confidence}% confidence</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
              <strong>${escapeHtml(item.impact)}</strong>
            </article>
          `
        )
        .join("")
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(String(locale ?? "en"))}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(t("SalonFlowAI Analytics Preview"))}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 42px;
    background: #050711;
    color: #f7f8ff;
    font-family: Inter, Arial, sans-serif;
  }
  header {
    padding: 30px;
    border: 1px solid #34305f;
    border-radius: 24px;
    background: #0d1324;
  }
  .overline {
    color: #ffd36a;
    font-weight: 900;
    letter-spacing: 2px;
    font-size: 12px;
  }
  h1 { margin: 10px 0 6px; font-size: 38px; }
  p, small, span { color: #aab3ca; }
  section {
    margin-top: 24px;
    padding: 24px;
    border-radius: 20px;
    background: #0d1324;
    border: 1px solid #252d44;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .metric, .signal, .action {
    padding: 18px;
    border-radius: 16px;
    background: #111a2f;
    border: 1px solid #2a3652;
  }
  .metric strong, .signal strong {
    display: block;
    margin: 8px 0;
    font-size: 24px;
    color: #39f5a6;
  }
  .action strong { color: #ffd36a; }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 12px;
    border-bottom: 1px solid #273047;
    text-align: left;
  }
  footer {
    margin-top: 28px;
    color: #75809a;
    font-size: 12px;
  }
  @media print {
    body { background: white; color: #111827; }
    header, section, .metric, .signal, .action {
      background: white;
      color: #111827;
      border-color: #d1d5db;
    }
    p, small, span { color: #4b5563; }
  }
</style>
</head>
<body>
  <header>
    <div class="overline">SALONFLOW AI</div>
    <h1>${escapeHtml(t("Salon Intelligence"))}</h1>
    <p>${escapeHtml(periodLabel)} ${escapeHtml(dataMode === "live" ? t("live export · selected real data") : t("preview export · presentation-only data"))}</p>
  </header>

  ${
    sections.overview
      ? `
        <section>
          <h2>${escapeHtml(t("Executive Overview"))}</h2>
          <div class="grid">${kpis}</div>
          <p><strong>${escapeHtml(t("Salon Health Index"))}:</strong> ${model.aiScore}/100 · ${escapeHtml(model.aiStatus)}</p>
          <p>${escapeHtml(model.primarySignal)}</p>
        </section>
      `
      : ""
  }

  ${
    sections.clients
      ? `
        <section>
          <h2>${escapeHtml(t("Client Intelligence"))}</h2>
          <div class="grid">${clients}</div>
        </section>
      `
      : ""
  }

  ${
    sections.services
      ? `
        <section>
          <h2>${escapeHtml(t("Service Intelligence"))}</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${escapeHtml(t("Service"))}</th>
                <th>${escapeHtml(t("Revenue"))}</th>
                <th>${escapeHtml(t("Bookings"))}</th>
                <th>${escapeHtml(t("Demand"))}</th>
              </tr>
            </thead>
            <tbody>${services}</tbody>
          </table>
        </section>
      `
      : ""
  }

  ${
    sections.ai
      ? `
        <section>
          <h2>${escapeHtml(t("AI Recommended Actions"))}</h2>
          <div class="grid">${actions}</div>
        </section>
      `
      : ""
  }

  <footer>
    SalonFlowAI Analytics V2 · ${escapeHtml(dataMode === "live" ? t("Live selected-period export") : t("Preview-only export"))} · ${escapeHtml(t("Generated locally"))}
  </footer>
</body>
</html>`;
}

function downloadFile(
  content: string,
  mimeType: string,
  filename: string
): boolean {
  if (
    Platform.OS !== "web" ||
    typeof document === "undefined" ||
    typeof URL === "undefined"
  ) {
    return false;
  }

  const blob = new Blob([content], {
    type: `${mimeType};charset=utf-8`,
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
  return true;
}

export default function AnalyticsExportSheetV2({
  visible,
  model,
  periodLabel,
  dataMode = "preview",
  onClose,
}: Props) {
  const { locale } = useAppPreferences();
  const t = (
    source: string,
    params: Record<string, string | number> = {}
  ) => analyticsV2SurfaceT(locale, source, params);

  const [format, setFormat] =
    useState<ExportFormat>("report");

  const [preparing, setPreparing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [sections, setSections] = useState<
    Record<ExportSectionKey, boolean>
  >({
    overview: true,
    revenue: true,
    clients: true,
    services: true,
    operations: true,
    ai: true,
  });

  const selectedCount = useMemo(
    () =>
      Object.values(sections).filter(Boolean).length,
    [sections]
  );

  const toggleSection = (key: ExportSectionKey) => {
    setSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
    setStatus(null);
  };

  const prepareExport = () => {
    if (preparing || selectedCount === 0) return;

    setPreparing(true);
    setStatus(t("Preparing export package…"));

    window.setTimeout(() => {
      const slug = periodLabel.toLowerCase();

      const content =
        format === "csv"
          ? buildCsv(model, sections, locale)
          : buildHtml(
              model,
              periodLabel,
              sections,
              dataMode,
              locale
            );

      const downloaded = downloadFile(
        content,
        format === "csv"
          ? "text/csv"
          : "text/html",
        format === "csv"
          ? `salonflowai-analytics-${slug}.csv`
          : `salonflowai-analytics-${slug}.html`
      );

      setPreparing(false);

      setStatus(
        downloaded
          ? format === "csv"
            ? t("CSV export downloaded successfully.")
            : t("Print-ready report downloaded successfully.")
          : t("Preview export is currently downloadable on web.")
      );
    }, 650);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="download-outline"
                size={24}
                color={COLORS.violet}
              />
            </View>

            <View style={styles.headerCopy}>
              <Text style={styles.overline}>
                {t("ANALYTICS EXPORT CENTER")}
              </Text>
              <Text style={styles.title}>
                {t("Prepare intelligence export")}
              </Text>
              <Text style={styles.subtitle}>
                {t("Select a format and the sections to include.")}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close export center")}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={21}
                color={COLORS.text}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={styles.content}
          >
            <View style={styles.periodPanel}>
              <View>
                <Text style={styles.periodLabel}>
                  {t("SELECTED PERIOD")}
                </Text>
                <Text style={styles.periodValue}>
                  {periodLabel}
                </Text>
              </View>

              <View style={styles.previewPill}>
                <View style={styles.previewDot} />
                <Text style={styles.previewText}>
                  {dataMode === "live"
                    ? t("LIVE DATA")
                    : t("PREVIEW DATA")}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              {t("Export format")}
            </Text>

            <View style={styles.formatGrid}>
              <Pressable
                onPress={() => {
                  setFormat("report");
                  setStatus(null);
                }}
                style={[
                  styles.formatCard,
                  format === "report" &&
                    styles.formatCardActive,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={23}
                  color={
                    format === "report"
                      ? COLORS.violet
                      : COLORS.secondary
                  }
                />
                <Text style={styles.formatTitle}>
                  {t("Print-ready report")}
                </Text>
                <Text style={styles.formatHint}>
                  {t("Download HTML and print or save as PDF.")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setFormat("csv");
                  setStatus(null);
                }}
                style={[
                  styles.formatCard,
                  format === "csv" &&
                    styles.formatCardActive,
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={23}
                  color={
                    format === "csv"
                      ? COLORS.emerald
                      : COLORS.secondary
                  }
                />
                <Text style={styles.formatTitle}>
                  {t("CSV data")}
                </Text>
                <Text style={styles.formatHint}>
                  {t("Download structured preview metrics.")}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              {t("Included sections")}
            </Text>

            <View style={styles.sectionsGrid}>
              {SECTION_OPTIONS.map((section) => {
                const active = sections[section.key];

                return (
                  <Pressable
                    key={section.key}
                    onPress={() =>
                      toggleSection(section.key)
                    }
                    style={[
                      styles.sectionCard,
                      active &&
                        styles.sectionCardActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.sectionIcon,
                        active &&
                          styles.sectionIconActive,
                      ]}
                    >
                      <Ionicons
                        name={section.icon}
                        size={19}
                        color={
                          active
                            ? COLORS.cyan
                            : COLORS.muted
                        }
                      />
                    </View>

                    <View style={styles.sectionCopy}>
                      <Text style={styles.sectionName}>
                        {t(section.label)}
                      </Text>
                      <Text
                        style={styles.sectionDescription}
                      >
                        {t(section.description)}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        active
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={21}
                      color={
                        active
                          ? COLORS.emerald
                          : COLORS.muted
                      }
                    />
                  </Pressable>
                );
              })}
            </View>

            {status ? (
              <View style={styles.statusPanel}>
                <Ionicons
                  name={
                    preparing
                      ? "sync-outline"
                      : "checkmark-circle-outline"
                  }
                  size={18}
                  color={
                    preparing
                      ? COLORS.cyan
                      : COLORS.emerald
                  }
                />
                <Text style={styles.statusText}>
                  {status}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t("{count} sections selected", {
                count: selectedCount,
              })}
            </Text>

            <Pressable
              disabled={
                preparing || selectedCount === 0
              }
              onPress={prepareExport}
              style={[
                styles.exportButton,
                (preparing || selectedCount === 0) &&
                  styles.exportButtonDisabled,
              ]}
            >
              <Ionicons
                name={
                  preparing
                    ? "sync-outline"
                    : "download-outline"
                }
                size={18}
                color="#071016"
              />
              <Text style={styles.exportButtonText}>
                {preparing
                  ? t("Preparing…")
                  : t("Prepare export")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,4,10,0.84)",
  },
  sheet: {
    width: "100%",
    maxWidth: 860,
    maxHeight: "94%",
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(140,124,255,0.30)",
    backgroundColor: "rgba(9,14,28,0.99)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 21,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(140,124,255,0.14)",
  },
  headerCopy: {
    flex: 1,
  },
  overline: {
    color: COLORS.violet,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  content: {
    padding: 19,
    gap: 16,
  },
  periodPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 17,
    padding: 15,
    backgroundColor: "rgba(88,216,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(88,216,255,0.17)",
  },
  periodLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  periodValue: {
    color: COLORS.cyan,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },
  previewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: COLORS.cyan,
  },
  previewText: {
    color: COLORS.secondary,
    fontSize: 8,
    fontWeight: "900",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formatCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 210,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 15,
  },
  formatCardActive: {
    borderColor: "rgba(140,124,255,0.45)",
    backgroundColor: "rgba(140,124,255,0.10)",
  },
  formatTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
  },
  formatHint: {
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  sectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  sectionCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 235,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: 12,
  },
  sectionCardActive: {
    borderColor: "rgba(88,216,255,0.24)",
    backgroundColor: "rgba(88,216,255,0.07)",
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  sectionIconActive: {
    backgroundColor: "rgba(88,216,255,0.12)",
  },
  sectionCopy: {
    flex: 1,
  },
  sectionName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  sectionDescription: {
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },
  statusPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(57,245,166,0.07)",
    borderWidth: 1,
    borderColor: "rgba(57,245,166,0.14)",
  },
  statusText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 10,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 17,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "rgba(7,11,23,0.99)",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  exportButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: COLORS.emerald,
  },
  exportButtonDisabled: {
    opacity: 0.45,
  },
  exportButtonText: {
    color: "#071016",
    fontSize: 11,
    fontWeight: "900",
  },
});
