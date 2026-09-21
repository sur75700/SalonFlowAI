import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { useDashboardTheme } from "../../hooks/useDashboardTheme";
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

const EXPORT_BACKGROUND_MODULES = {
  royal_cosmos: require("../../assets/backgrounds/royal-cosmos.jpg"),
  royal_gold_cosmos: require("../../assets/backgrounds/royal-gold-cosmos.jpg"),
} as const;

type ExportBackgroundThemeId = keyof typeof EXPORT_BACKGROUND_MODULES;

function normalizeExportThemeId(
  value: string | null | undefined
): ExportBackgroundThemeId {
  return value === "royal_gold_cosmos"
    ? "royal_gold_cosmos"
    : "royal_cosmos";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("background-read-failed"));
    reader.readAsDataURL(blob);
  });
}

async function resolveExportBackgroundDataUrl(
  selectedThemeId: string | null | undefined
): Promise<{ dataUrl: string; themeId: ExportBackgroundThemeId }> {
  const themeId = normalizeExportThemeId(selectedThemeId);
  const assetModule =
    EXPORT_BACKGROUND_MODULES[themeId];

  if (Platform.OS === "web") {
    const uri =
      typeof assetModule === "string"
        ? assetModule
        : assetModule?.uri;

    if (!uri) {
      throw new Error(
        "analytics-export-web-background-uri-unavailable"
      );
    }

    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        "analytics-export-web-background-fetch-failed"
      );
    }

    return {
      dataUrl: await blobToDataUrl(
        await response.blob()
      ),
      themeId,
    };
  }

  const resolved = Image.resolveAssetSource(
    assetModule
  );

  const uri = resolved?.uri;

  if (!uri) {
    throw new Error(
      "analytics-export-background-uri-unavailable"
    );
  }

  let readableUri = uri;

  if (/^https?:\/\//i.test(uri)) {
    const directory =
      FileSystem.cacheDirectory ??
      FileSystem.documentDirectory;

    if (!directory) {
      throw new Error(
        "analytics-export-background-cache-unavailable"
      );
    }

    const download =
      await FileSystem.downloadAsync(
        uri,
        `${directory}salonflowai-analytics-${themeId}.jpg`
      );

    readableUri = download.uri;
  }

  const base64 =
    await FileSystem.readAsStringAsync(
      readableUri,
      {
        encoding:
          FileSystem.EncodingType.Base64,
      }
    );

  return {
    dataUrl:
      `data:image/jpeg;base64,${base64}`,
    themeId,
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const CSV_FORMULA_PREFIX_PATTERN =
  /^[\s\uFEFF]*[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]/u;
const CSV_NUMERIC_TEXT_PATTERN =
  /^-?\d+(?:[.,]\d+)?%?$/;

function escapeCsv(value: unknown): string {
  const raw = String(value ?? "");
  const trustedNumeric =
    typeof value === "number" ||
    CSV_NUMERIC_TEXT_PATTERN.test(raw.trim());

  const protectedText =
    !trustedNumeric &&
    CSV_FORMULA_PREFIX_PATTERN.test(raw)
      ? `'${raw}`
      : raw;

  return `"${protectedText.replaceAll('"', '""')}"`;
}

function buildCsv(
  model: AnalyticsPreviewModel,
  periodLabel: string,
  sections: Record<ExportSectionKey, boolean>,
  dataMode: "preview" | "live",
  locale: string | null | undefined,
  generatedAtIso: string
): string {
  const t = (
    source: string,
    params: Record<string, string | number> = {}
  ) => analyticsV2SurfaceT(locale, source, params);

  const rows: unknown[][] = [
    ["SalonFlowAI Analytics"],
    [t("Selected period"), periodLabel],
    [
      t("Data mode"),
      dataMode === "live" ? t("Live") : t("Preview"),
    ],
    [t("Generated at"), generatedAtIso],
    [],
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
        item.current,
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
        t(
          "{count} bookings · {share}% vs the most-booked service",
          { count: item.bookings, share: item.share }
        ),
      ]);
    });
  }

  if (sections.operations) {
    model.statuses.forEach((item) => {
      rows.push([
        t("Operations"),
        item.label,
        item.value,
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

  return "\uFEFF" + rows
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

function buildHtml(
  model: AnalyticsPreviewModel,
  periodLabel: string,
  sections: Record<ExportSectionKey, boolean>,
  dataMode: "preview" | "live",
  locale: string | null | undefined,
  generatedAtIso: string,
  backgroundDataUrl: string,
  backgroundThemeId: ExportBackgroundThemeId
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

  const revenueRows = sections.revenue
    ? model.revenueSeries
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.label)}</td>
              <td>${escapeHtml(item.current)}</td>
              <td>${escapeHtml(item.previous)}</td>
            </tr>
          `
        )
        .join("")
    : "";

  const operationRows = sections.operations
    ? model.statuses
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.label)}</td>
              <td>${escapeHtml(item.value)}</td>
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

  const goldTheme =
    backgroundThemeId === "royal_gold_cosmos";
  const accent = goldTheme ? "#FFD36A" : "#8C7CFF";
  const metricAccent = goldTheme ? "#FFE6A3" : "#39F5A6";
  const borderAccent = goldTheme
    ? "rgba(255,211,106,0.34)"
    : "rgba(140,124,255,0.34)";

  return `<!doctype html>
<html lang="${escapeHtml(String(locale ?? "en"))}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(`SalonFlowAI Analytics · ${periodLabel} · ${generatedAtIso.slice(0, 10)}`)}</title>
<style>
  :root {
    --accent: ${accent};
    --metric-accent: ${metricAccent};
    --accent-border: ${borderAccent};
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html {
    min-height: 100%;
    height: auto;
    overflow-x: hidden;
    overflow-y: auto;
  }
  body {
    min-height: 100vh;
    height: auto;
    margin: 0;
    padding: 42px;
    overflow-x: hidden;
    overflow-y: auto;
    background: #050711;
    color: #f7f8ff;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  }
  .cosmos-background {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .cosmos-background img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
  .cosmos-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 15%, rgba(140,124,255,0.13), transparent 34%),
      linear-gradient(180deg, rgba(4,6,18,0.30), rgba(4,6,18,0.72) 72%, rgba(4,6,18,0.86));
  }
  .report-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1180px;
    min-height: 100vh;
    margin: 0 auto;
  }
  header {
    padding: 30px;
    border: 1px solid var(--accent-border);
    border-radius: 24px;
    background: rgba(8,13,31,0.90);
    box-shadow: 0 24px 80px rgba(0,0,0,0.34);
  }
  .overline {
    color: var(--accent);
    font-weight: 900;
    letter-spacing: 2px;
    font-size: 12px;
  }
  h1 { margin: 10px 0 6px; font-size: 38px; }
  h2 { margin-top: 0; }
  p, small, span { color: #b5bfd6; }
  section {
    margin-top: 24px;
    padding: 24px;
    border-radius: 20px;
    background: rgba(8,13,31,0.91);
    border: 1px solid rgba(112,128,175,0.25);
    box-shadow: 0 18px 58px rgba(0,0,0,0.26);
    break-inside: avoid;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .metric, .signal, .action {
    padding: 18px;
    border-radius: 16px;
    background: rgba(16,26,50,0.88);
    border: 1px solid rgba(85,105,153,0.34);
    break-inside: avoid;
  }
  .metric strong, .signal strong {
    display: block;
    margin: 8px 0;
    font-size: 24px;
    color: var(--metric-accent);
  }
  .action strong { color: #ffd36a; }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 12px;
    border-bottom: 1px solid rgba(85,105,153,0.28);
    text-align: left;
  }
  th { color: #f4f7ff; }
  footer {
    margin-top: 28px;
    padding: 14px 4px 4px;
    color: #8d98b3;
    font-size: 12px;
  }
  @media (max-width: 760px) {
    body { padding: 18px; }
    .grid { grid-template-columns: 1fr; }
    h1 { font-size: 30px; }
  }
  @page { size: auto; margin: 0; }
  @media print {
    html,
    body {
      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    body {
      padding: 12mm;
      background: #050711 !important;
      color: #f7f8ff !important;
    }
    .report-content {
      width: 100% !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    .cosmos-background { position: fixed; }
    header, section, .metric, .signal, .action {
      color: #f7f8ff !important;
      box-shadow: none;
    }
    p, small, span { color: #b5bfd6 !important; }
  }
</style>
</head>
<body>
  <div class="cosmos-background" aria-hidden="true">
    <img src="${backgroundDataUrl}" alt="">
    <div class="cosmos-overlay"></div>
  </div>
  <main class="report-content">
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
    sections.revenue
      ? `
        <section>
          <h2>${escapeHtml(t("Revenue Intelligence"))}</h2>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(t("Metric"))}</th>
                <th>${escapeHtml(t("Current Period Revenue"))}</th>
                <th>${escapeHtml(t("Previous Period Revenue"))}</th>
              </tr>
            </thead>
            <tbody>${revenueRows}</tbody>
          </table>
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
    sections.operations
      ? `
        <section>
          <h2>${escapeHtml(t("Booking Status"))}</h2>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(t("Booking status"))}</th>
                <th>${escapeHtml(t("Bookings"))}</th>
              </tr>
            </thead>
            <tbody>${operationRows}</tbody>
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
  </main>
</body>
</html>`;
}

type ExportDelivery =
  | "web-downloaded"
  | "native-shared"
  | "native-share-unavailable"
  | "unavailable";

function sanitizeFilenamePart(value: string): string {
  return (
    value
      .normalize("NFKC")
      .trim()
      .replace(/[\/:*?"<>|\u0000-\u001F]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "export"
  );
}

function buildProfessionalFilename(
  format: ExportFormat,
  periodLabel: string,
  locale: string | null | undefined,
  dataMode: "preview" | "live",
  generatedAtIso: string
): string {
  const period = sanitizeFilenamePart(periodLabel);
  const language = sanitizeFilenamePart(
    String(locale ?? "en")
  ).toUpperCase();
  const mode = dataMode === "live" ? "Live" : "Preview";
  const date = generatedAtIso.slice(0, 10);
  const extension = format === "csv" ? "csv" : "html";

  return (
    `SalonFlowAI-Analytics-${mode}-${period}-` +
    `${date}-${language}.${extension}`
  );
}

function fillPrintWindow(
  printWindow: Window,
  html: string
): boolean {
  try {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    let printTriggered = false;

    const triggerPrint = () => {
      if (printTriggered) return;

      printTriggered = true;

      try {
        printWindow.focus();

        if (
          typeof printWindow.print === "function"
        ) {
          printWindow.print();
        }
      } catch (error) {
        console.error(
          "PRINT_DIALOG_ERROR",
          error
        );
      }
    };

    const schedulePrint = () => {
      printWindow.setTimeout(
        triggerPrint,
        300
      );
    };

    if (
      printWindow.document.readyState ===
      "complete"
    ) {
      schedulePrint();
    } else {
      printWindow.addEventListener(
        "load",
        schedulePrint,
        { once: true }
      );

      // Fail-safe for browsers whose document.write()
      // lifecycle does not surface the load event reliably.
      printWindow.setTimeout(
        triggerPrint,
        1800
      );
    }

    return true;
  } catch (error) {
    console.error(
      "PRINT_RENDER_ERROR",
      error
    );

    return false;
  }
}


async function deliverExport(
  content: string,
  mimeType: string,
  filename: string
): Promise<ExportDelivery> {
  if (Platform.OS === "web") {
    if (
      typeof document === "undefined" ||
      typeof URL === "undefined" ||
      typeof Blob === "undefined"
    ) {
      return "unavailable";
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

    setTimeout(() => URL.revokeObjectURL(url), 0);
    return "web-downloaded";
  }

  const directory =
    FileSystem.cacheDirectory ??
    FileSystem.documentDirectory;

  if (!directory) {
    return "unavailable";
  }

  const uri = `${directory}${filename}`;

  await FileSystem.writeAsStringAsync(
    uri,
    content,
    { encoding: FileSystem.EncodingType.UTF8 }
  );

  if (!(await Sharing.isAvailableAsync())) {
    return "native-share-unavailable";
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: filename,
  });

  return "native-shared";
}

export default function AnalyticsExportSheetV2({
  visible,
  model,
  periodLabel,
  dataMode = "preview",
  onClose,
}: Props) {
  const { locale } = useAppPreferences();
  const { selectedThemeId } = useDashboardTheme();
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

  const prepareExport = async () => {
    if (preparing || selectedCount === 0) return;

    const printWindow =
      format === "report" &&
      Platform.OS === "web" &&
      typeof window !== "undefined"
        ? window.open(
            "",
            "_blank",
            "width=1200,height=900"
          )
        : null;

    if (
      format === "report" &&
      Platform.OS === "web" &&
      !printWindow
    ) {
      setStatus(
        t("Unable to open print preview.")
      );

      return;
    }

    setPreparing(true);
    setStatus(t("Preparing export package…"));

    try {

      const generatedAtIso = new Date().toISOString();
      const reportBackground =
        format === "report"
          ? await resolveExportBackgroundDataUrl(
              selectedThemeId
            )
          : null;

      const content =
        format === "csv"
          ? buildCsv(
              model,
              periodLabel,
              sections,
              dataMode,
              locale,
              generatedAtIso
            )
          : buildHtml(
              model,
              periodLabel,
              sections,
              dataMode,
              locale,
              generatedAtIso,
              reportBackground?.dataUrl ?? "",
              reportBackground?.themeId ??
                "royal_cosmos"
            );

      const mimeType =
        format === "csv"
          ? "text/csv"
          : "text/html";

      const filename = buildProfessionalFilename(
        format,
        periodLabel,
        locale,
        dataMode,
        generatedAtIso
      );

      if (
        format === "report" &&
        Platform.OS === "web"
      ) {
        const printed = printWindow
          ? fillPrintWindow(
              printWindow,
              content
            )
          : false;

        if (
          !printed &&
          printWindow &&
          !printWindow.closed
        ) {
          printWindow.close();
        }

        setStatus(
          printed
            ? t("Print preview opened. Save as PDF.")
            : t("Unable to open print preview.")
        );

        return;
      }

      const delivery = await deliverExport(
        content,
        mimeType,
        filename
      );

      if (delivery === "web-downloaded") {
        setStatus(
          format === "csv"
            ? t("CSV export downloaded successfully.")
            : t(
                "Print-ready report downloaded successfully."
              )
        );
      } else if (delivery === "native-shared") {
        setStatus(
          t("Export ready in the system share sheet.")
        );
      } else if (
        delivery === "native-share-unavailable"
      ) {
        setStatus(
          t(
            "Export prepared, but sharing is unavailable on this device."
          )
        );
      } else {
        setStatus(t("Export could not be prepared."));
      }
    } catch (error) {
      if (
        printWindow &&
        !printWindow.closed
      ) {
        printWindow.close();
      }

      console.error(
        "ANALYTICS_EXPORT_FATAL",
        error
      );

      setStatus(
        t("Export could not be prepared.")
      );
    } finally {
      setPreparing(false);
    }
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
