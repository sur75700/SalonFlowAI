import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { analyticsV2SurfaceT } from "./analytics-v2-i18n";

export type AnalyticsInsightSheetKey =
  | "executive"
  | "clients"
  | "service"
  | "playbook";

type InsightTone =
  | "violet"
  | "emerald"
  | "cyan"
  | "gold"
  | "rose";

type InsightMetric = {
  label: string;
  value: string;
  hint: string;
};

type InsightBreakdown = {
  label: string;
  value: number;
  hint: string;
};

type InsightEvidence = {
  title: string;
  description: string;
  value: string;
};

type InsightStep = {
  number: string;
  title: string;
  description: string;
};

type InsightDetail = {
  overline: string;
  title: string;
  subtitle: string;
  tone: InsightTone;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  heroValue: string;
  heroLabel: string;
  heroHint: string;
  metrics: InsightMetric[];
  breakdown?: InsightBreakdown[];
  evidence: InsightEvidence[];
  steps: InsightStep[];
  impactLabel: string;
  impactValue: string;
  implementationNote: string;
};

type Props = {
  visible: boolean;
  insightKey: AnalyticsInsightSheetKey | null;
  onClose: () => void;
};

const COLORS = {
  canvas: "#050711",
  surface: "#0D1324",
  surfaceRaised: "#111A2F",
  surfaceStrong: "#17213B",
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

const TONES: Record<
  InsightTone,
  {
    accent: string;
    soft: string;
    surface: string;
    border: string;
  }
> = {
  violet: {
    accent: COLORS.violet,
    soft: "rgba(140,124,255,0.14)",
    surface: "#17173B",
    border: "rgba(140,124,255,0.30)",
  },
  emerald: {
    accent: COLORS.emerald,
    soft: "rgba(57,245,166,0.13)",
    surface: "#102D29",
    border: "rgba(57,245,166,0.28)",
  },
  cyan: {
    accent: COLORS.cyan,
    soft: "rgba(88,216,255,0.13)",
    surface: "#102A38",
    border: "rgba(88,216,255,0.28)",
  },
  gold: {
    accent: COLORS.gold,
    soft: "rgba(255,211,106,0.14)",
    surface: "#32291A",
    border: "rgba(255,211,106,0.28)",
  },
  rose: {
    accent: COLORS.rose,
    soft: "rgba(255,107,138,0.14)",
    surface: "#351A2A",
    border: "rgba(255,107,138,0.29)",
  },
};

/**
 * PRESENTATION-ONLY DETAIL DATA.
 *
 * These values exist only to verify visual hierarchy,
 * information density and interaction ergonomics.
 * They do not represent real salon business data.
 */
const DETAILS: Record<
  AnalyticsInsightSheetKey,
  InsightDetail
> = {
  executive: {
    overline: "AI EXECUTIVE INTELLIGENCE",
    title: "Business Health Deep Dive",
    subtitle:
      "An explainable view of the signals composing the Salon Health Index.",
    tone: "violet",
    icon: "sparkles-outline",
    heroValue: "78 / 100",
    heroLabel: "Salon Health Index",
    heroHint:
      "Healthy performance with one high-value near-term opportunity.",
    metrics: [
      {
        label: "Period momentum",
        value: "+16.2%",
        hint: "Combined preview performance",
      },
      {
        label: "Strongest signal",
        value: "Revenue",
        hint: "Positive completed-revenue trend",
      },
      {
        label: "Primary risk",
        value: "Retention",
        hint: "At-risk clients require attention",
      },
      {
        label: "Decision confidence",
        value: "87%",
        hint: "Preview evidence quality",
      },
    ],
    breakdown: [
      {
        label: "Revenue health",
        value: 82,
        hint: "Completed revenue and period momentum",
      },
      {
        label: "Client retention",
        value: 74,
        hint: "Returning and at-risk client signals",
      },
      {
        label: "Service demand",
        value: 86,
        hint: "Bookings and service contribution",
      },
      {
        label: "Operational health",
        value: 68,
        hint: "Completion and cancellation behavior",
      },
      {
        label: "Risk control",
        value: 79,
        hint: "Avoidable-loss exposure",
      },
    ],
    evidence: [
      {
        title: "Revenue momentum",
        description:
          "The current preview period consistently remains above the comparison period.",
        value: "+18.4%",
      },
      {
        title: "Client opportunity",
        description:
          "A small at-risk segment contains meaningful potential value.",
        value: "8 clients",
      },
      {
        title: "Service concentration",
        description:
          "One leading service contributes disproportionate demand and revenue.",
        value: "92% relative",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Observe",
        description:
          "Confirm which signal changed most during the selected period.",
      },
      {
        number: "02",
        title: "Diagnose",
        description:
          "Review the supporting client, service and operational evidence.",
      },
      {
        number: "03",
        title: "Prioritize",
        description:
          "Select the highest-impact action with acceptable effort.",
      },
      {
        number: "04",
        title: "Measure",
        description:
          "Compare the expected impact with the next completed period.",
      },
    ],
    impactLabel: "STRONGEST PREVIEW OPPORTUNITY",
    impactValue: "AMD 648K potential recovery",
    implementationNote:
      "The engineering phase will replace every preview score with centralized, explainable real-data calculations.",
  },

  clients: {
    overline: "CLIENT REACTIVATION COMMAND",
    title: "Recover At-risk Clients",
    subtitle:
      "A focused decision surface for understanding booking rhythm, urgency and potential recovery.",
    tone: "rose",
    icon: "people-outline",
    heroValue: "8",
    heroLabel: "At-risk clients",
    heroHint:
      "Clients exceeding their expected preview booking rhythm.",
    metrics: [
      {
        label: "Loyal segment",
        value: "3",
        hint: "High historical contribution",
      },
      {
        label: "Regular segment",
        value: "5",
        hint: "Consistent previous behavior",
      },
      {
        label: "Action window",
        value: "7 days",
        hint: "Recommended review timing",
      },
      {
        label: "Confidence",
        value: "89%",
        hint: "Preview classification strength",
      },
    ],
    breakdown: [
      {
        label: "Relationship strength",
        value: 88,
        hint: "Historical booking consistency",
      },
      {
        label: "Recovery probability",
        value: 76,
        hint: "Preview likelihood of return",
      },
      {
        label: "Revenue importance",
        value: 91,
        hint: "Contribution potential",
      },
      {
        label: "Urgency",
        value: 84,
        hint: "Time sensitivity",
      },
    ],
    evidence: [
      {
        title: "Booking rhythm exceeded",
        description:
          "The current gap is longer than the segment’s normal preview booking cycle.",
        value: "+21 days",
      },
      {
        title: "High-value concentration",
        description:
          "Several clients belong to historically stronger contribution segments.",
        value: "3 clients",
      },
      {
        title: "Recoverable demand",
        description:
          "The segment has meaningful recent service affinity.",
        value: "2 services",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Review the segment",
        description:
          "Inspect booking rhythm, service affinity and last completed visit.",
      },
      {
        number: "02",
        title: "Choose the message",
        description:
          "Use a personalized reactivation approach rather than a generic promotion.",
      },
      {
        number: "03",
        title: "Protect margin",
        description:
          "Prioritize service relevance before offering any discount.",
      },
      {
        number: "04",
        title: "Track return",
        description:
          "Measure recovered clients and completed revenue after execution.",
      },
    ],
    impactLabel: "POTENTIAL PREVIEW RECOVERY",
    impactValue: "AMD 648K",
    implementationNote:
      "The real-data phase will calculate at-risk status from documented booking-cycle rules, never arbitrary labels.",
  },

  service: {
    overline: "SERVICE GROWTH INTELLIGENCE",
    title: "Scale Your Strongest Service",
    subtitle:
      "A complete service-performance view combining demand, revenue contribution and growth potential.",
    tone: "emerald",
    icon: "rocket-outline",
    heroValue: "AMD 648K",
    heroLabel: "Preview service revenue",
    heroHint:
      "Balayage Signature leads the current design scenario.",
    metrics: [
      {
        label: "Bookings",
        value: "42",
        hint: "Preview completed and scheduled demand",
      },
      {
        label: "Relative demand",
        value: "92%",
        hint: "Compared with the leading service",
      },
      {
        label: "Period growth",
        value: "+18%",
        hint: "Preview period comparison",
      },
      {
        label: "Completion",
        value: "89%",
        hint: "Operational fulfillment signal",
      },
    ],
    breakdown: [
      {
        label: "Revenue contribution",
        value: 92,
        hint: "Relative service contribution",
      },
      {
        label: "Booking velocity",
        value: 84,
        hint: "Demand momentum",
      },
      {
        label: "Client repeat signal",
        value: 73,
        hint: "Preview repeat-service affinity",
      },
      {
        label: "Promotion readiness",
        value: 88,
        hint: "Growth opportunity strength",
      },
    ],
    evidence: [
      {
        title: "Demand leadership",
        description:
          "This service ranks first in the preview service-performance model.",
        value: "#1",
      },
      {
        title: "Strong revenue quality",
        description:
          "The service combines booking volume with a high average value.",
        value: "AMD 15.4K",
      },
      {
        title: "Repeat behavior",
        description:
          "Returning clients show stronger affinity than first-time clients.",
        value: "68%",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Protect delivery quality",
        description:
          "Ensure increased promotion does not reduce service consistency.",
      },
      {
        number: "02",
        title: "Target the right segment",
        description:
          "Focus on clients whose service history supports the recommendation.",
      },
      {
        number: "03",
        title: "Select the period",
        description:
          "Promote during capacity windows with available operational room.",
      },
      {
        number: "04",
        title: "Measure contribution",
        description:
          "Track completed bookings, revenue and repeat-service behavior.",
      },
    ],
    impactLabel: "PREVIEW GROWTH OPPORTUNITY",
    impactValue: "AMD 312K",
    implementationNote:
      "The production phase will derive service intelligence from real appointment-service relationships and price snapshots.",
  },

  playbook: {
    overline: "RISK REDUCTION PLAYBOOK",
    title: "Reduce Cancellation Friction",
    subtitle:
      "A structured operational playbook for understanding and protecting avoidable appointment value.",
    tone: "gold",
    icon: "shield-checkmark-outline",
    heroValue: "AMD 184K",
    heroLabel: "Preview protected value",
    heroHint:
      "Potential appointment value exposed to avoidable cancellation risk.",
    metrics: [
      {
        label: "Cancellation rate",
        value: "7.4%",
        hint: "Current preview period",
      },
      {
        label: "Affected bookings",
        value: "18",
        hint: "Cancelled appointments",
      },
      {
        label: "High-value exposure",
        value: "6",
        hint: "Priority appointments",
      },
      {
        label: "Confidence",
        value: "81%",
        hint: "Preview recommendation strength",
      },
    ],
    breakdown: [
      {
        label: "Revenue exposure",
        value: 83,
        hint: "Potential value at risk",
      },
      {
        label: "Operational urgency",
        value: 78,
        hint: "Timing importance",
      },
      {
        label: "Preventability",
        value: 69,
        hint: "Estimated avoidable share",
      },
      {
        label: "Implementation effort",
        value: 46,
        hint: "Relative execution complexity",
      },
    ],
    evidence: [
      {
        title: "High-value concentration",
        description:
          "Several cancellations appear in stronger-value appointment segments.",
        value: "6 bookings",
      },
      {
        title: "Timing pattern",
        description:
          "The preview pattern suggests risk increases close to the appointment.",
        value: "< 24 hours",
      },
      {
        title: "Service dependency",
        description:
          "A small number of services carry most exposed value.",
        value: "2 services",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Segment the risk",
        description:
          "Separate early cancellations, late cancellations and no-shows.",
      },
      {
        number: "02",
        title: "Improve confirmation",
        description:
          "Use timely reminders appropriate to appointment value and lead time.",
      },
      {
        number: "03",
        title: "Protect capacity",
        description:
          "Create a controlled recovery process for newly available slots.",
      },
      {
        number: "04",
        title: "Measure prevention",
        description:
          "Compare cancellation rate and protected completed revenue.",
      },
    ],
    impactLabel: "PREVIEW VALUE PROTECTION",
    impactValue: "AMD 184K",
    implementationNote:
      "The production engine will separate cancelled, no-show and completed statuses before calculating avoidable value.",
  },
};


function localizeInsightDetail(
  locale: string | null | undefined,
  detail: InsightDetail
): InsightDetail {
  const t = (source: string) =>
    analyticsV2SurfaceT(locale, source);

  return {
    ...detail,
    overline: t(detail.overline),
    title: t(detail.title),
    subtitle: t(detail.subtitle),
    heroValue: t(detail.heroValue),
    heroLabel: t(detail.heroLabel),
    heroHint: t(detail.heroHint),
    metrics: detail.metrics.map((metric) => ({
      ...metric,
      label: t(metric.label),
      value: t(metric.value),
      hint: t(metric.hint),
    })),
    breakdown: detail.breakdown?.map((item) => ({
      ...item,
      label: t(item.label),
      hint: t(item.hint),
    })),
    evidence: detail.evidence.map((item) => ({
      ...item,
      title: t(item.title),
      description: t(item.description),
      value: t(item.value),
    })),
    steps: detail.steps.map((step) => ({
      ...step,
      title: t(step.title),
      description: t(step.description),
    })),
    impactLabel: t(detail.impactLabel),
    impactValue: t(detail.impactValue),
    implementationNote: t(detail.implementationNote),
  };
}

function MetricCard({
  metric,
  accent,
  soft,
  border,
}: {
  metric: InsightMetric;
  accent: string;
  soft: string;
  border: string;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: soft,
          borderColor: border,
        },
      ]}
    >
      <Text
        style={[
          styles.metricValue,
          { color: accent },
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
  );
}

function BreakdownRow({
  item,
  accent,
}: {
  item: InsightBreakdown;
  accent: string;
}) {
  const safeValue = Math.max(
    0,
    Math.min(item.value, 100)
  );

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHeader}>
        <View style={styles.breakdownCopy}>
          <Text style={styles.breakdownLabel}>
            {item.label}
          </Text>
          <Text style={styles.breakdownHint}>
            {item.hint}
          </Text>
        </View>

        <Text
          style={[
            styles.breakdownValue,
            { color: accent },
          ]}
        >
          {safeValue}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width:
                `${safeValue}%` as `${number}%`,
              backgroundColor: accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function AnalyticsInsightSheetV2({
  visible,
  insightKey,
  onClose,
}: Props) {
  const { locale } = useAppPreferences();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const t = (source: string) =>
    analyticsV2SurfaceT(locale, source);

  const detailSource =
    insightKey !== null
      ? DETAILS[insightKey]
      : DETAILS.executive;

  const detail =
    localizeInsightDetail(locale, detailSource);

  const tone = TONES[detail.tone];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Close intelligence details")}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            wide && styles.sheetWide,
            { borderColor: tone.border },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.sheetGlow,
              { backgroundColor: tone.soft },
            ]}
          />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderMain}>
              <View
                style={[
                  styles.sheetIcon,
                  {
                    backgroundColor: tone.soft,
                    borderColor: tone.border,
                  },
                ]}
              >
                <Ionicons
                  name={detail.icon}
                  size={25}
                  color={tone.accent}
                />
              </View>

              <View style={styles.sheetHeaderCopy}>
                <View style={styles.overlineRow}>
                  <Text
                    style={[
                      styles.sheetOverline,
                      { color: tone.accent },
                    ]}
                  >
                    {detail.overline}
                  </Text>

                  <View style={styles.previewBadge}>
                    <View
                      style={[
                        styles.previewDot,
                        {
                          backgroundColor:
                            tone.accent,
                        },
                      ]}
                    />
                    <Text style={styles.previewText}>
                      {t("PREVIEW DATA")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sheetTitle}>
                  {detail.title}
                </Text>

                <Text style={styles.sheetSubtitle}>
                  {detail.subtitle}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close")}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="close"
                size={22}
                color={COLORS.text}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator
            nestedScrollEnabled
            contentContainerStyle={styles.scrollContent}
          >
            <View
              style={[
                styles.heroPanel,
                {
                  backgroundColor: tone.surface,
                  borderColor: tone.border,
                },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.heroValue,
                    { color: tone.accent },
                  ]}
                >
                  {detail.heroValue}
                </Text>

                <Text style={styles.heroLabel}>
                  {detail.heroLabel}
                </Text>

                <Text style={styles.heroHint}>
                  {detail.heroHint}
                </Text>
              </View>

              <View
                style={[
                  styles.heroOrb,
                  { borderColor: tone.accent },
                ]}
              >
                <Ionicons
                  name={detail.icon}
                  size={30}
                  color={tone.accent}
                />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              {detail.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  metric={metric}
                  accent={tone.accent}
                  soft={tone.soft}
                  border={tone.border}
                />
              ))}
            </View>

            {detail.breakdown ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.sectionIcon,
                      {
                        backgroundColor:
                          tone.soft,
                      },
                    ]}
                  >
                    <Ionicons
                      name="analytics-outline"
                      size={19}
                      color={tone.accent}
                    />
                  </View>

                  <View style={styles.sectionCopy}>
                    <Text style={styles.sectionTitle}>
                      {t("Intelligence Breakdown")}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      {t(
                        "Explainable components behind this preview signal."
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.breakdownList}>
                  {detail.breakdown.map((item) => (
                    <BreakdownRow
                      key={item.label}
                      item={item}
                      accent={tone.accent}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: tone.soft },
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={19}
                    color={tone.accent}
                  />
                </View>

                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>
                    {t("Supporting Evidence")}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {t(
                      "The strongest signals supporting the recommendation."
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.evidenceGrid}>
                {detail.evidence.map((item) => (
                  <View
                    key={item.title}
                    style={styles.evidenceCard}
                  >
                    <Text style={styles.evidenceTitle}>
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.evidenceValue,
                        { color: tone.accent },
                      ]}
                    >
                      {item.value}
                    </Text>

                    <Text
                      style={styles.evidenceDescription}
                    >
                      {item.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: tone.soft },
                  ]}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={19}
                    color={tone.accent}
                  />
                </View>

                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>
                    {t("Recommended Decision Path")}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {t(
                      "A clear sequence from evidence to measurable action."
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.stepsList}>
                {detail.steps.map((step) => (
                  <View
                    key={step.number}
                    style={styles.stepRow}
                  >
                    <View
                      style={[
                        styles.stepNumber,
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
                          styles.stepNumberText,
                          { color: tone.accent },
                        ]}
                      >
                        {step.number}
                      </Text>
                    </View>

                    <View style={styles.stepCopy}>
                      <Text style={styles.stepTitle}>
                        {step.title}
                      </Text>
                      <Text
                        style={styles.stepDescription}
                      >
                        {step.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.impactPanel,
                {
                  backgroundColor: tone.soft,
                  borderColor: tone.border,
                },
              ]}
            >
              <View>
                <Text style={styles.impactLabel}>
                  {detail.impactLabel}
                </Text>

                <Text
                  style={[
                    styles.impactValue,
                    { color: tone.accent },
                  ]}
                >
                  {detail.impactValue}
                </Text>
              </View>

              <Ionicons
                name="trending-up-outline"
                size={29}
                color={tone.accent}
              />
            </View>

            <View style={styles.notePanel}>
              <Ionicons
                name="construct-outline"
                size={18}
                color={COLORS.gold}
              />

              <Text style={styles.noteText}>
                {detail.implementationNote}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <View style={styles.footerStatus}>
              <View
                style={[
                  styles.footerDot,
                  {
                    backgroundColor:
                      tone.accent,
                  },
                ]}
              />
              <Text style={styles.footerStatusText}>
                {t("Presentation-only intelligence")}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close intelligence view")}
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                {
                  backgroundColor:
                    tone.accent,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.doneButtonText}>
                {t("Close intelligence view")}
              </Text>

              <Ionicons
                name="checkmark"
                size={18}
                color="#061014"
              />
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
    backgroundColor: "rgba(2,4,10,0.82)",
  },
  sheet: {
    width: "100%",
    maxWidth: 780,
    maxHeight: "94%",
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: "rgba(9,14,28,0.99)",
    overflow: "hidden",
  },
  sheetWide: {
    maxWidth: 1040,
  },
  sheetGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 360,
    right: -170,
    top: -210,
    opacity: 0.8,
  },
  sheetHeader: {
    zIndex: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetHeaderMain: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  sheetIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeaderCopy: {
    flex: 1,
  },
  overlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
  },
  sheetOverline: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
  },
  previewText: {
    color: COLORS.secondary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 7,
  },
  sheetSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 730,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },

  scrollContent: {
    padding: 20,
    gap: 16,
  },
  heroPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  heroValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  heroLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  heroHint: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 600,
  },
  heroOrb: {
    width: 70,
    height: 70,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 155,
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  metricLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 7,
  },
  metricHint: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  section: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(13,19,36,0.96)",
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 17,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  breakdownList: {
    gap: 15,
  },
  breakdownRow: {
    gap: 9,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  breakdownCopy: {
    flex: 1,
  },
  breakdownLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  breakdownHint: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 3,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },

  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  evidenceCard: {
    flexGrow: 1,
    flexBasis: "31%",
    minWidth: 185,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  evidenceTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  evidenceValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 9,
  },
  evidenceDescription: {
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 7,
  },

  stepsList: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: "900",
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },
  stepDescription: {
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  impactPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  impactLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  impactValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 7,
  },
  notePanel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,211,106,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,211,106,0.14)",
  },
  noteText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 15,
  },

  sheetFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "rgba(7,11,23,0.99)",
  },
  footerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },
  footerStatusText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  doneButton: {
    minHeight: 43,
    borderRadius: 13,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doneButtonText: {
    color: "#061014",
    fontSize: 11,
    fontWeight: "900",
  },
});
