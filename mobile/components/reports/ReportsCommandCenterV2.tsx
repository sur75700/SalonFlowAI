import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { t } from "../../lib/i18n";

import {
  fetchReportCatalog,
  fetchReportPreview,
} from "../../lib/reports/api";

import type {
  ReportApiError,
} from "../../lib/reports/api";

import {
  downloadReportExport,
} from "../../lib/reports/download";

import {
  findReportDefinition,
} from "../../lib/reports/contracts";

import type {
  ReportCatalog,
  ReportDocument,
  ReportFormat,
  ReportLocale,
  ReportQuery,
  ReportType,
} from "../../lib/reports/contracts";

import ReportCatalogSelector from "./ReportCatalogSelector";
import ReportFilterPanel from "./ReportFilterPanel";

import type {
  ReportFilterState,
} from "./ReportFilterPanel";

import ReportPreviewPanel from "./ReportPreviewPanel";
import ReportExportSheet from "./ReportExportSheet";

type Props = {
  token: string;
  locale: ReportLocale;
  refreshKey: number;
  onAuthExpired: () => void;
};

type CosmosSectionProps = {
  title: string;
  subtitle: string;
  accent?: string;
  children: React.ReactNode;
};

const EMPTY_FILTERS: ReportFilterState = {
  startDate: "",
  endDate: "",
  statuses: [],
  clientIds: "",
  serviceIds: "",
  currency: undefined,
};

function parseIds(
  value: string,
): string[] | undefined {
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length
    ? parsed
    : undefined;
}

function reportError(
  error: unknown,
): ReportApiError {
  return error as ReportApiError;
}

function formatMessage(
  template: string,
  values: Record<
    string,
    string | number
  >,
): string {
  return Object.entries(
    values,
  ).reduce(
    (result, [key, value]) =>
      result.replace(
        `{${key}}`,
        String(value),
      ),
    template,
  );
}

function CosmosSection({
  title,
  subtitle,
  accent = "#8D7CFF",
  children,
}: CosmosSectionProps) {
  return (
    <View style={styles.section}>
      <View
        style={[
          styles.sectionGlow,
          {
            backgroundColor:
              `${accent}10`,
          },
        ]}
      />

      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionGlyph,
            {
              borderColor:
                `${accent}55`,
              backgroundColor:
                `${accent}16`,
            },
          ]}
        >
          <View
            style={[
              styles.sectionGlyphDot,
              {
                backgroundColor:
                  accent,
              },
            ]}
          />
        </View>

        <View
          style={
            styles.sectionHeaderCopy
          }
        >
          <Text
            style={styles.sectionTitle}
          >
            {title}
          </Text>

          <Text
            style={
              styles.sectionSubtitle
            }
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {children}
    </View>
  );
}

export default function ReportsCommandCenterV2({
  token,
  locale,
  refreshKey,
  onAuthExpired,
}: Props) {
  const [catalog, setCatalog] =
    useState<ReportCatalog | null>(
      null,
    );

  const [
    selectedReportType,
    setSelectedReportType,
  ] = useState<ReportType>(
    "daily-summary",
  );

  const [filters, setFilters] =
    useState<ReportFilterState>(
      EMPTY_FILTERS,
    );

  const [preview, setPreview] =
    useState<ReportDocument | null>(
      null,
    );

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [
    exportOpen,
    setExportOpen,
  ] = useState(false);

  const onAuthExpiredRef =
    useRef(onAuthExpired);

  const previewRequestId =
    useRef(0);

  useEffect(() => {
    onAuthExpiredRef.current =
      onAuthExpired;
  }, [onAuthExpired]);

  useEffect(() => {
    let active = true;

    const loadCatalog =
      async () => {
        try {
          setCatalogLoading(true);
          setError("");

          const next =
            await fetchReportCatalog(
              token,
            );

          if (!active) return;

          setCatalog(next);

          setSelectedReportType(
            (current) =>
              next.report_types.some(
                (item) =>
                  item.report_type ===
                  current,
              )
                ? current
                : next.report_types[0]
                    ?.report_type ??
                  "daily-summary",
          );

          const defaultCurrency =
            next.money
              .fiat_report_currencies[0];

          setFilters((current) => ({
            ...current,
            currency:
              current.currency ??
              defaultCurrency,
          }));
        } catch (caught) {
          if (!active) return;

          const normalized =
            reportError(caught);

          if (normalized.auth) {
            onAuthExpiredRef.current();
            return;
          }

          if (
            normalized.forbidden
          ) {
            setError(
              t(
                "reports.commandCenter.accessDenied",
                locale,
              ),
            );
            return;
          }

          setError(
            t(
              "reports.commandCenter.catalogLoadFailed",
              locale,
            ),
          );
        } finally {
          if (active) {
            setCatalogLoading(false);
          }
        }
      };

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [
    token,
    refreshKey,
    locale,
  ]);

  useEffect(() => {
    previewRequestId.current += 1;

    setPreviewLoading(false);
    setPreview(null);
    setExportOpen(false);
    setError("");
    setNotice("");
  }, [
    selectedReportType,
    locale,
    refreshKey,
  ]);

  const definition = useMemo(() => {
    if (!catalog) {
      return null;
    }

    return findReportDefinition(
      catalog,
      selectedReportType,
    );
  }, [
    catalog,
    selectedReportType,
  ]);

  const buildQuery =
    (): ReportQuery => {
      if (!definition) {
        return {
          locale,
        };
      }

      const startDate =
        filters.startDate.trim() ||
        undefined;

      const endDate =
        definition.period ===
        "single_calendar_date"
          ? startDate
          : filters.endDate.trim() ||
            undefined;

      return {
        startDate,
        endDate,
        locale,

        status:
          definition.filters.includes(
            "status",
          )
            ? filters.statuses
            : undefined,

        clientId:
          definition.filters.includes(
            "client_id",
          )
            ? parseIds(
                filters.clientIds,
              )
            : undefined,

        serviceId:
          definition.filters.includes(
            "service_id",
          )
            ? parseIds(
                filters.serviceIds,
              )
            : undefined,

        currency:
          definition.currency_mode ===
          "required_fiat"
            ? filters.currency
            : undefined,
      };
    };

  const handlePreview =
    async () => {
      if (!definition) {
        return;
      }

      if (
        definition.currency_mode ===
          "required_fiat" &&
        !filters.currency
      ) {
        setError(
          t(
            "reports.commandCenter.chooseCurrency",
            locale,
          ),
        );

        return;
      }

      const requestId =
        ++previewRequestId.current;

      try {
        setPreviewLoading(true);
        setError("");
        setNotice("");
        setExportOpen(false);

        const document =
          await fetchReportPreview(
            token,
            selectedReportType,
            buildQuery(),
          );

        if (
          requestId !==
          previewRequestId.current
        ) {
          return;
        }

        setPreview(document);
      } catch (caught) {
        if (
          requestId !==
          previewRequestId.current
        ) {
          return;
        }

        const normalized =
          reportError(caught);

        if (normalized.auth) {
          onAuthExpiredRef.current();
          return;
        }

        if (
          normalized.forbidden
        ) {
          setError(
            t(
              "reports.commandCenter.accessDenied",
              locale,
            ),
          );

          return;
        }

        if (
          normalized.code ===
          "422_capacity_unavailable"
        ) {
          setError(
            t(
              "reports.commandCenter.capacityUnavailable",
              locale,
            ),
          );

          return;
        }

        setError(
          t(
            "reports.commandCenter.previewFailed",
            locale,
          ),
        );
      } finally {
        if (
          requestId ===
          previewRequestId.current
        ) {
          setPreviewLoading(false);
        }
      }
    };

  const handleExport = async (
    format: ReportFormat,
  ): Promise<boolean> => {
    if (!definition || !preview) {
      setError(
        t(
          "reports.commandCenter.previewRequired",
          locale,
        ),
      );

      return false;
    }

    try {
      setError("");
      setNotice("");

      const result =
        await downloadReportExport(
          token,
          selectedReportType,
          format,
          buildQuery(),
        );

      setNotice(
        formatMessage(
          t(
            result.shared
              ? "reports.commandCenter.shareReady"
              : "reports.commandCenter.exportSuccess",
            locale,
          ),
          {
            file:
              result.filename,
          },
        ),
      );

      return true;
    } catch (caught) {
      const normalized =
        reportError(caught);

      if (normalized.auth) {
        onAuthExpiredRef.current();
        return false;
      }

      if (
        normalized.forbidden
      ) {
        setError(
          t(
            "reports.commandCenter.accessDenied",
            locale,
          ),
        );

        return false;
      }

      if (
        normalized.code ===
        "422_capacity_unavailable"
      ) {
        setError(
          t(
            "reports.commandCenter.capacityUnavailable",
            locale,
          ),
        );

        return false;
      }

      setError(
        t(
          "reports.commandCenter.exportFailed",
          locale,
        ),
      );

      return false;
    }
  };

  const reportTitle =
    definition
      ? t(
          definition.title_key,
          locale,
        )
      : t(
          "reports.commandCenter.catalogTitle",
          locale,
        );

  if (
    catalogLoading &&
    !catalog
  ) {
    return (
      <CosmosSection
        title={t(
          "reports.commandCenter.loadingCatalogTitle",
          locale,
        )}
        subtitle={t(
          "reports.commandCenter.loadingCatalogSubtitle",
          locale,
        )}
      >
        <View style={styles.statePanel}>
          <View style={styles.stateGlyph}>
            <Text
              style={
                styles.stateGlyphText
              }
            >
              ✦
            </Text>
          </View>

          <Text
            style={styles.stateTitle}
          >
            {t(
              "reports.commandCenter.loadingCatalogTitle",
              locale,
            )}
          </Text>

          <Text
            style={styles.stateText}
          >
            {t(
              "reports.commandCenter.loadingCatalogSubtitle",
              locale,
            )}
          </Text>
        </View>
      </CosmosSection>
    );
  }

  if (!catalog || !definition) {
    return (
      <CosmosSection
        title={t(
          "reports.commandCenter.catalogUnavailableTitle",
          locale,
        )}
        subtitle={t(
          "reports.commandCenter.catalogUnavailableSubtitle",
          locale,
        )}
        accent="#FF7F9E"
      >
        <View style={styles.errorPanel}>
          <Text
            style={styles.errorTitle}
          >
            {t(
              "reports.commandCenter.catalogUnavailableTitle",
              locale,
            )}
          </Text>

          <Text
            style={styles.errorText}
          >
            {error ||
              t(
                "reports.commandCenter.noCatalog",
                locale,
              )}
          </Text>
        </View>
      </CosmosSection>
    );
  }

  const catalogSubtitle =
    formatMessage(
      t(
        "reports.commandCenter.catalogSubtitle",
        locale,
      ),
      {
        count:
          catalog.report_type_count,

        formats:
          catalog.formats.length,
      },
    );

  const previewSubtitle =
    formatMessage(
      t(
        "reports.commandCenter.previewSubtitle",
        locale,
      ),
      {
        preview:
          catalog.limits
            .preview_rows,

        export:
          catalog.limits
            .export_rows,
      },
    );

  return (
    <>
      {error ? (
        <View style={styles.errorPanel}>
          <Text
            style={styles.errorTitle}
          >
            {t(
              "reports.commandCenter.catalogUnavailableTitle",
              locale,
            )}
          </Text>

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setError("")
            }
            style={
              styles.dismissButton
            }
          >
            <Text
              style={
                styles.dismissButtonText
              }
            >
              {t(
                "reports.commandCenter.dismiss",
                locale,
              )}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {notice ? (
        <View style={styles.noticePanel}>
          <Text
            style={styles.noticeTitle}
          >
            {t(
              "reports.commandCenter.exportComplete",
              locale,
            )}
          </Text>

          <Text
            style={styles.noticeText}
          >
            {notice}
          </Text>
        </View>
      ) : null}

      <CosmosSection
        title={t(
          "reports.commandCenter.catalogTitle",
          locale,
        )}
        subtitle={catalogSubtitle}
        accent="#F2D17A"
      >
        <ReportCatalogSelector
          entries={
            catalog.report_types
          }
          selected={
            selectedReportType
          }
          locale={locale}
          onSelect={
            setSelectedReportType
          }
        />
      </CosmosSection>

      <CosmosSection
        title={reportTitle}
        subtitle={t(
          "reports.commandCenter.configureSubtitle",
          locale,
        )}
        accent="#8D7CFF"
      >
        <ReportFilterPanel
          catalog={catalog}
          definition={definition}
          value={filters}
          locale={locale}
          disabled={previewLoading}
          onChange={(next) => {
            previewRequestId.current += 1;

            setPreviewLoading(false);
            setFilters(next);
            setPreview(null);
            setExportOpen(false);
            setNotice("");
          }}
        />

        <Pressable
          accessibilityRole="button"
          disabled={previewLoading}
          onPress={handlePreview}
          style={[
            styles.primaryButton,
            previewLoading &&
              styles.disabledButton,
          ]}
        >
          <View
            style={styles.buttonDot}
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            {previewLoading
              ? t(
                  "reports.commandCenter.loadingPreview",
                  locale,
                )
              : t(
                  "reports.commandCenter.loadPreview",
                  locale,
                )}
          </Text>
        </Pressable>
      </CosmosSection>

      <CosmosSection
        title={t(
          "reports.commandCenter.previewTitle",
          locale,
        )}
        subtitle={previewSubtitle}
        accent="#67C2FF"
      >
        <ReportPreviewPanel
          document={preview}
          locale={locale}
          loading={previewLoading}
        />

        <Pressable
          accessibilityRole="button"
          disabled={
            !preview ||
            previewLoading
          }
          onPress={() =>
            setExportOpen(true)
          }
          style={[
            styles.exportButton,
            (!preview ||
              previewLoading) &&
              styles.disabledButton,
          ]}
        >
          <Text
            style={
              styles.exportButtonText
            }
          >
            {t(
              "reports.commandCenter.openExport",
              locale,
            )}
          </Text>

          <Text
            style={styles.exportArrow}
          >
            →
          </Text>
        </Pressable>
      </CosmosSection>

      <CosmosSection
        title={t(
          "reports.commandCenter.trustTitle",
          locale,
        )}
        subtitle={t(
          "reports.commandCenter.trustSubtitle",
          locale,
        )}
        accent="#72E0A8"
      >
        <View style={styles.trustGrid}>
          <View style={styles.trustCard}>
            <View
              style={
                styles.trustGreenDot
              }
            />

            <View style={styles.trustCopy}>
              <Text
                style={styles.trustKey}
              >
                {t(
                  "reports.commandCenter.serverGenerated",
                  locale,
                )}
              </Text>

              <Text
                style={
                  styles.trustValue
                }
              >
                {t(
                  "reports.commandCenter.serverGeneratedValue",
                  locale,
                )}
              </Text>
            </View>
          </View>

          <View style={styles.trustCard}>
            <View
              style={
                styles.trustBlueDot
              }
            />

            <View style={styles.trustCopy}>
              <Text
                style={styles.trustKey}
              >
                {t(
                  "reports.commandCenter.dateHandling",
                  locale,
                )}
              </Text>

              <Text
                style={
                  styles.trustValue
                }
              >
                {t(
                  "reports.commandCenter.dateHandlingValue",
                  locale,
                )}
              </Text>
            </View>
          </View>

          <View style={styles.trustCard}>
            <View
              style={
                styles.trustGoldDot
              }
            />

            <View style={styles.trustCopy}>
              <Text
                style={styles.trustKey}
              >
                {t(
                  "reports.commandCenter.currencyPolicy",
                  locale,
                )}
              </Text>

              <Text
                style={
                  styles.trustValue
                }
              >
                {t(
                  "reports.commandCenter.currencyPolicyValue",
                  locale,
                )}
              </Text>
            </View>
          </View>

          <View style={styles.trustCard}>
            <View
              style={
                styles.trustVioletDot
              }
            />

            <View style={styles.trustCopy}>
              <Text
                style={styles.trustKey}
              >
                {t(
                  "reports.commandCenter.historyPolicy",
                  locale,
                )}
              </Text>

              <Text
                style={
                  styles.trustValue
                }
              >
                {t(
                  "reports.commandCenter.historyPolicyValue",
                  locale,
                )}
              </Text>
            </View>
          </View>
        </View>
      </CosmosSection>

      <ReportExportSheet
        visible={exportOpen}
        formats={catalog.formats}
        reportTitle={reportTitle}
        locale={locale}
        onClose={() =>
          setExportOpen(false)
        }
        onExport={handleExport}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    position: "relative",
    overflow: "hidden",

    backgroundColor:
      "#19163F",

    borderRadius: 26,

    borderWidth: 1,
    borderColor:
      "rgba(145,128,255,0.38)",

    padding: 19,
    marginBottom: 17,

    shadowColor: "#02030D",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 8,
  },

  sectionGlow: {
    position: "absolute",

    width: 220,
    height: 220,
    borderRadius: 110,

    right: -95,
    top: -120,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 11,
    marginBottom: 16,
  },

  sectionGlyph: {
    width: 34,
    height: 34,
    borderRadius: 13,

    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  sectionGlyphDot: {
    width: 7,
    height: 7,
    borderRadius: 4,

    shadowColor: "#8D7CFF",
    shadowOpacity: 0.65,
    shadowRadius: 7,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: "#FFFFFF",

    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",

    letterSpacing: -0.35,

    marginBottom: 3,
  },

  sectionSubtitle: {
    color: "#9F9AAF",

    fontSize: 11,
    lineHeight: 17,
  },

  statePanel: {
    alignItems: "center",

    backgroundColor:
      "#211D4D",

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.22)",

    borderRadius: 20,

    paddingVertical: 28,
    paddingHorizontal: 20,
  },

  stateGlyph: {
    width: 50,
    height: 50,
    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(139,114,255,0.14)",

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.32)",

    marginBottom: 12,
  },

  stateGlyphText: {
    color: "#B8A7FF",

    fontSize: 20,
    fontWeight: "900",
  },

  stateTitle: {
    color: "#FFFFFF",

    fontSize: 15,
    fontWeight: "900",

    marginBottom: 5,
  },

  stateText: {
    color: "#9D98AD",

    fontSize: 11,
    lineHeight: 17,

    textAlign: "center",
    maxWidth: 560,
  },

  errorPanel: {
    backgroundColor:
      "rgba(94,24,46,0.54)",

    borderWidth: 1,
    borderColor:
      "rgba(255,104,139,0.30)",

    borderRadius: 19,

    padding: 15,
    marginBottom: 16,
  },

  errorTitle: {
    color: "#FFFFFF",

    fontSize: 14,
    fontWeight: "900",

    marginBottom: 5,
  },

  errorText: {
    color: "#FFC8D5",

    fontSize: 11,
    lineHeight: 17,
  },

  dismissButton: {
    alignSelf: "flex-start",

    marginTop: 10,

    borderRadius: 999,

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",

    backgroundColor:
      "rgba(255,255,255,0.06)",

    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  dismissButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  noticePanel: {
    backgroundColor:
      "rgba(40,102,74,0.32)",

    borderWidth: 1,
    borderColor:
      "rgba(114,224,168,0.30)",

    borderRadius: 19,

    padding: 15,
    marginBottom: 16,
  },

  noticeTitle: {
    color: "#FFFFFF",

    fontSize: 14,
    fontWeight: "900",

    marginBottom: 5,
  },

  noticeText: {
    color: "#BDEFD2",

    fontSize: 11,
    lineHeight: 17,
  },

  primaryButton: {
    alignSelf: "flex-start",

    minHeight: 48,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    backgroundColor: "#8D7CFF",

    borderRadius: 16,

    paddingHorizontal: 22,
    paddingVertical: 13,

    marginTop: 20,

    shadowColor: "#8D7CFF",
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 8,
  },

  buttonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,

    backgroundColor: "#FFFFFF",
    opacity: 0.82,
  },

  primaryButtonText: {
    color: "#FFFFFF",

    fontSize: 12,
    fontWeight: "900",
  },

  exportButton: {
    alignSelf: "flex-start",

    minHeight: 46,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,

    backgroundColor:
      "rgba(139,114,255,0.11)",

    borderRadius: 16,

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.62)",

    paddingHorizontal: 20,
    paddingVertical: 12,

    marginTop: 18,
  },

  exportButtonText: {
    color: "#D9D0FF",

    fontSize: 12,
    fontWeight: "900",
  },

  exportArrow: {
    color: "#B8A7FF",

    fontSize: 16,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.40,
  },

  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  trustCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 160,

    flexDirection: "row",
    alignItems: "center",

    gap: 10,

    backgroundColor:
      "#211D4B",

    borderRadius: 17,

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.07)",

    padding: 13,
  },

  trustCopy: {
    flex: 1,
    minWidth: 0,
  },

  trustKey: {
    color: "#8F899E",

    fontSize: 8,
    fontWeight: "900",

    textTransform: "uppercase",
    letterSpacing: 0.65,

    marginBottom: 4,
  },

  trustValue: {
    color: "#FFFFFF",

    fontSize: 11,
    lineHeight: 16,

    fontWeight: "800",
  },

  trustGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#72E0A8",
  },

  trustBlueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#67C2FF",
  },

  trustGoldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F2D17A",
  },

  trustVioletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CF8CFF",
  },
});
