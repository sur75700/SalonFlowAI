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

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { analyticsV2SurfaceT } from "./analytics-v2-i18n";
import type {
  AnalyticsPreviewModel,
} from "./analytics-v2-types";
import type {
  AnalyticsInsightSheetKey,
} from "./AnalyticsInsightSheetV2";

type Props = {
  visible: boolean;
  insightKey: AnalyticsInsightSheetKey | null;
  model: AnalyticsPreviewModel;
  onClose: () => void;
};

type MetricRow = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

const COLORS = {
  text: "#F7F8FF",
  secondary: "#AAB3CA",
  muted: "#75809A",
  border: "rgba(255,255,255,0.09)",
  violet: "#8C7CFF",
  emerald: "#39F5A6",
  cyan: "#58D8FF",
  gold: "#FFD36A",
  rose: "#FF6B8A",
} as const;

const TONES = {
  executive: {
    accent: COLORS.violet,
    soft: "rgba(140,124,255,0.14)",
    border: "rgba(140,124,255,0.30)",
  },
  clients: {
    accent: COLORS.rose,
    soft: "rgba(255,107,138,0.14)",
    border: "rgba(255,107,138,0.30)",
  },
  service: {
    accent: COLORS.emerald,
    soft: "rgba(57,245,166,0.13)",
    border: "rgba(57,245,166,0.28)",
  },
  playbook: {
    accent: COLORS.gold,
    soft: "rgba(255,211,106,0.14)",
    border: "rgba(255,211,106,0.28)",
  },
} as const;

function findKpi(
  model: AnalyticsPreviewModel,
  id: string
) {
  return model.kpis.find(
    (item) => item.id === id
  );
}

function findClientSignal(
  model: AnalyticsPreviewModel,
  id: string
) {
  return model.clientSignals.find(
    (item) => item.id === id
  );
}

export default function AnalyticsLiveInsightSheetV2({
  visible,
  insightKey,
  model,
  onClose,
}: Props) {
  const { locale } = useAppPreferences();
  const t = (
    source: string,
    params: Record<string, string | number> = {}
  ) => analyticsV2SurfaceT(locale, source, params);

  const resolvedKey =
    insightKey ?? "executive";

  const tone = TONES[resolvedKey];

  const revenue = findKpi(
    model,
    "revenue"
  );

  const bookings = findKpi(
    model,
    "bookings"
  );

  const ticket = findKpi(
    model,
    "ticket"
  );

  const cancellation = findKpi(
    model,
    "cancellation"
  );

  const retention =
    findClientSignal(
      model,
      "retention"
    );

  const atRisk =
    findClientSignal(
      model,
      "at-risk"
    );

  const topService =
    model.services[0] ?? null;

  const selectedAction =
    resolvedKey === "clients"
      ? model.actions.find(
          (action) => action.id === "a1"
        )
      : resolvedKey === "service"
        ? model.actions.find(
            (action) => action.id === "a2"
          )
        : resolvedKey === "playbook"
          ? model.actions.find(
              (action) => action.id === "a3"
            )
          : null;

  const title =
    resolvedKey === "clients"
      ? t("Client Reactivation Intelligence")
      : resolvedKey === "service"
        ? t("Service Growth Intelligence")
        : resolvedKey === "playbook"
          ? t("Cancellation Risk Playbook")
          : t("Business Health Deep Dive");

  const overline =
    resolvedKey === "clients"
      ? t("LIVE CLIENT INTELLIGENCE")
      : resolvedKey === "service"
        ? t("LIVE SERVICE INTELLIGENCE")
        : resolvedKey === "playbook"
          ? t("LIVE RISK INTELLIGENCE")
          : t("LIVE EXECUTIVE INTELLIGENCE");

  const heroValue =
    resolvedKey === "clients"
      ? atRisk?.value ?? "0"
      : resolvedKey === "service"
        ? topService?.revenue ?? "—"
        : resolvedKey === "playbook"
          ? cancellation?.value ?? "0%"
          : `${model.aiScore} / 100`;

  const heroLabel =
    resolvedKey === "clients"
      ? t("At-risk clients")
      : resolvedKey === "service"
        ? topService?.name ??
          t("No active service")
        : resolvedKey === "playbook"
          ? t("Cancellation rate")
          : model.aiStatus;

  let metricRows: MetricRow[];

  if (resolvedKey === "clients") {
    metricRows =
      model.clientSignals.map(
        (signal) => ({
          id: signal.id,
          label: signal.label,
          value: signal.value,
          hint: signal.hint,
        })
      );
  } else if (resolvedKey === "service") {
    metricRows =
      model.services
        .slice(0, 4)
        .map((service) => ({
          id: service.id,
          label: service.name,
          value: service.revenue,
          hint: t(
            "{count} bookings · {share}% relative demand",
            {
              count: service.bookings,
              share: service.share,
            }
          ),
        }));
  } else if (
    resolvedKey === "playbook"
  ) {
    metricRows = [
      {
        id: "cancellation-rate",
        label:
          cancellation?.label ??
          t("Cancellation Rate"),
        value:
          cancellation?.value ??
          "0%",
        hint:
          cancellation?.context ??
          "",
      },
      ...model.statuses
        .slice(0, 3)
        .map((status) => ({
          id: status.id,
          label: status.label,
          value: String(status.value),
          hint:
            t("selected-period appointments"),
        })),
    ];
  } else {
    metricRows =
      model.kpis
        .slice(0, 4)
        .map((kpi) => ({
          id: kpi.id,
          label: kpi.label,
          value: kpi.value,
          hint:
            `${kpi.delta} · ${kpi.context}`,
        }));
  }

  const evidenceRows: MetricRow[] = [
    {
      id: "revenue",
      label:
        revenue?.label ??
        t("Completed Revenue"),
      value: revenue?.value ?? "—",
      hint: revenue?.context ?? "",
    },
    {
      id: "bookings",
      label:
        bookings?.label ??
        t("Bookings"),
      value: bookings?.value ?? "0",
      hint: bookings?.context ?? "",
    },
    {
      id: "retention",
      label:
        retention?.label ??
        t("Retention"),
      value: retention?.value ?? "0%",
      hint: retention?.hint ?? "",
    },
    {
      id: "ticket",
      label:
        ticket?.label ??
        t("Average Ticket"),
      value: ticket?.value ?? "—",
      hint: ticket?.context ?? "",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Close live intelligence")}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            { borderColor: tone.border },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.headerIcon,
                {
                  backgroundColor:
                    tone.soft,
                  borderColor:
                    tone.border,
                },
              ]}
            >
              <Ionicons
                name="analytics-outline"
                size={24}
                color={tone.accent}
              />
            </View>

            <View style={styles.headerCopy}>
              <Text
                style={[
                  styles.overline,
                  { color: tone.accent },
                ]}
              >
                {overline}
              </Text>

              <Text style={styles.title}>
                {title}
              </Text>

              <Text style={styles.subtitle}>
                {t(
                  "Generated from the selected real-data period model."
                )}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close")}
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
            <View
              style={[
                styles.hero,
                {
                  backgroundColor:
                    tone.soft,
                  borderColor:
                    tone.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.heroValue,
                  { color: tone.accent },
                ]}
              >
                {heroValue}
              </Text>

              <Text style={styles.heroLabel}>
                {heroLabel}
              </Text>

              <Text style={styles.heroHint}>
                {selectedAction
                  ?.description ??
                  model.primarySignal}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              {metricRows.map((metric) => (
                <View
                  key={metric.id}
                  style={styles.metricCard}
                >
                  <Text
                    style={[
                      styles.metricValue,
                      { color: tone.accent },
                    ]}
                  >
                    {metric.value}
                  </Text>

                  <Text style={styles.metricLabel}>
                    {metric.label}
                  </Text>

                  <Text style={styles.metricHint}>
                    {metric.hint}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionOverline}>
                {t("REAL SUPPORTING SIGNALS")}
              </Text>

              <Text style={styles.sectionTitle}>
                {t("Evidence from the selected period")}
              </Text>

              {evidenceRows.map((row) => (
                <View
                  key={row.id}
                  style={styles.evidenceRow}
                >
                  <View style={styles.evidenceCopy}>
                    <Text
                      style={styles.evidenceLabel}
                    >
                      {row.label}
                    </Text>

                    <Text
                      style={styles.evidenceHint}
                    >
                      {row.hint}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.evidenceValue,
                      { color: tone.accent },
                    ]}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionOverline}>
                {t("RECOMMENDED DECISION")}
              </Text>

              <Text style={styles.sectionTitle}>
                {selectedAction?.title ??
                  model.nextAction}
              </Text>

              <Text style={styles.decisionText}>
                {selectedAction
                  ?.description ??
                  model.primarySignal}
              </Text>

              <View
                style={[
                  styles.impactPanel,
                  {
                    backgroundColor:
                      tone.soft,
                    borderColor:
                      tone.border,
                  },
                ]}
              >
                <Text style={styles.impactLabel}>
                  {t("CALCULATED IMPACT")}
                </Text>

                <Text
                  style={[
                    styles.impactValue,
                    { color: tone.accent },
                  ]}
                >
                  {selectedAction?.impact ??
                    model.expectedImpact}
                </Text>
              </View>
            </View>

            <View style={styles.note}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={COLORS.cyan}
              />

              <Text style={styles.noteText}>
                {t(
                  "These signals are calculated deterministically from loaded appointment, client and service records. Other-currency records are excluded from selected-currency totals."
                )}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {model.previewLabel}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[
                styles.doneButton,
                {
                  backgroundColor:
                    tone.accent,
                },
              ]}
            >
              <Text style={styles.doneText}>
                {t("Close intelligence view")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(2,4,10,0.84)",
  },
  sheet: {
    width: "100%",
    maxWidth: 920,
    maxHeight: "94%",
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor:
      "rgba(9,14,28,0.99)",
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
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
  },
  overline: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
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
    backgroundColor:
      "rgba(255,255,255,0.06)",
  },
  content: {
    padding: 19,
    gap: 15,
  },
  hero: {
    borderRadius: 21,
    borderWidth: 1,
    padding: 19,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: "900",
  },
  heroLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 5,
  },
  heroHint: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 180,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      "rgba(255,255,255,0.035)",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  metricLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  metricHint: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  section: {
    padding: 17,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      "rgba(13,19,36,0.96)",
  },
  sectionOverline: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 14,
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(255,255,255,0.06)",
  },
  evidenceCopy: {
    flex: 1,
  },
  evidenceLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  evidenceHint: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 3,
  },
  evidenceValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  decisionText: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 18,
  },
  impactPanel: {
    marginTop: 14,
    borderRadius: 15,
    borderWidth: 1,
    padding: 13,
  },
  impactLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      "rgba(88,216,255,0.14)",
    backgroundColor:
      "rgba(88,216,255,0.07)",
  },
  noteText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 15,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  doneButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 13,
  },
  doneText: {
    color: "#061014",
    fontSize: 11,
    fontWeight: "900",
  },
});
