import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useDashboardTheme } from '../../../hooks/useDashboardTheme';
import DashboardThemeBackground from './DashboardThemeBackground';
import type {
  ClientRetentionPulseModel,
} from '../../../lib/dashboard/finalEnrichment';

export type ClientRetentionPulseLabels = Readonly<{
  title: string;
  subtitle: string;
  live: string;
  returningRatio: string;
  riskScore: string;
  singleAppointment: string;
  repeatHistory: string;
  inactive: string;
  atRisk: string;
  highRisk: string;
  lost: string;
  overlapNote: string;
  loading: string;
  refreshing: string;
  unavailable: string;
  empty: string;
}>;

export type ClientRetentionPulseV2Props = Readonly<{
  model: ClientRetentionPulseModel;
  labels: ClientRetentionPulseLabels;
}>;

const colors = {
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#77799C',
  royal: '#7C5CFF',
  gold: '#E8C97A',
  green: '#3FCF8E',
  amber: '#F2B84B',
  red: '#F2617A',
  softBorder: 'rgba(255,255,255,0.07)',
  softSurface: 'rgba(255,255,255,0.035)',
} as const;

function displayNumber(value: number | null): string {
  return value === null ? '—' : String(value);
}

function displayPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`;
}

function ClientRetentionPulseV2({
  model,
  labels,
}: ClientRetentionPulseV2Props) {
  const { theme } = useDashboardTheme();
  const [expanded, setExpanded] = React.useState(false);

  const stateText =
    model.state === 'loading'
      ? labels.loading
      : model.state === 'unavailable'
        ? labels.unavailable
        : model.state === 'empty'
          ? labels.empty
          : null;

  return (
    <>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={labels.title}
        onPress={() => setExpanded(true)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.palette.surface,
            borderColor: theme.palette.border,
            shadowColor: theme.palette.royal,
          },
          pressed && styles.cardPressed,
        ]}
      >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>{labels.subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          {model.state === 'available' || model.state === 'refreshing' ? (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>
                {model.state === 'available' ? labels.live : labels.refreshing}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.expandButton,
              {
                borderColor: theme.palette.borderStrong,
                backgroundColor: theme.palette.royalGlow,
              },
            ]}
          >
            <Ionicons
              name="expand-outline"
              size={15}
              color={theme.palette.royal}
            />
          </View>
        </View>
      </View>

      {stateText ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{stateText}</Text>
        </View>
      ) : (
        <>
          <View style={styles.primaryRow}>
            <View style={styles.primaryMetric}>
              <Text style={styles.primaryLabel}>{labels.returningRatio}</Text>
              <Text style={styles.primaryValue}>
                {displayPercent(model.returningRatioPercent)}
              </Text>
            </View>
            <View style={styles.primaryDivider} />
            <View style={styles.primaryMetric}>
              <Text style={styles.primaryLabel}>{labels.riskScore}</Text>
              <Text style={styles.primaryValue}>
                {displayPercent(model.riskScore)}
              </Text>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <MetricChip
              label={labels.singleAppointment}
              value={displayNumber(model.singleAppointmentClients)}
              accent={colors.gold}
            />
            <MetricChip
              label={labels.repeatHistory}
              value={displayNumber(model.repeatHistoryClients)}
              accent={colors.green}
            />
            <MetricChip
              label={labels.inactive}
              value={displayNumber(model.inactiveClients)}
              accent={colors.amber}
            />
            <MetricChip
              label={labels.atRisk}
              value={displayNumber(model.atRiskClients)}
              accent={colors.amber}
            />
            <MetricChip
              label={labels.highRisk}
              value={displayNumber(model.highRiskClients)}
              accent={colors.red}
            />
            <MetricChip
              label={labels.lost}
              value={displayNumber(model.lostClients)}
              accent={colors.red}
            />
          </View>

          <Text style={styles.footnote}>{labels.overlapNote}</Text>
        </>
      )}
      </Pressable>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setExpanded(false)}
      >
        <DashboardThemeBackground style={styles.modalRoot}>
          <SafeAreaView style={styles.modalSafe}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setExpanded(false)}
              accessibilityRole="button"
              accessibilityLabel={labels.title}
            />

            <View
              accessibilityViewIsModal
              style={[
                styles.modalPanel,
                {
                  backgroundColor: theme.palette.surface,
                  borderColor: theme.palette.borderStrong,
                  shadowColor: theme.palette.royal,
                },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.modalAura,
                  { backgroundColor: theme.palette.royalGlow },
                ]}
              />

              <View style={styles.modalHeader}>
                <View style={styles.headerCopy}>
                  <Text style={styles.modalTitle}>{labels.title}</Text>
                  <Text style={styles.modalSubtitle}>{labels.subtitle}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={labels.title}
                  hitSlop={8}
                  onPress={() => setExpanded(false)}
                  style={({ pressed }) => [
                    styles.modalClose,
                    {
                      borderColor: theme.palette.borderStrong,
                      backgroundColor: theme.palette.surfaceRaised,
                    },
                    pressed && styles.modalClosePressed,
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={theme.palette.textPrimary}
                  />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator
                contentContainerStyle={styles.modalContent}
              >
                {stateText ? (
                  <View style={styles.stateBox}>
                    <Text style={styles.stateText}>{stateText}</Text>
                  </View>
                ) : (
                  <>
                    <View
                      style={[
                        styles.expandedPrimaryRow,
                        {
                          borderColor: theme.palette.borderStrong,
                          backgroundColor: theme.palette.surfaceRaised,
                        },
                      ]}
                    >
                      <View style={styles.primaryMetric}>
                        <Text style={styles.primaryLabel}>{labels.returningRatio}</Text>
                        <Text style={styles.expandedPrimaryValue}>
                          {displayPercent(model.returningRatioPercent)}
                        </Text>
                      </View>
                      <View style={[styles.primaryDivider, { backgroundColor: theme.palette.border }]} />
                      <View style={styles.primaryMetric}>
                        <Text style={styles.primaryLabel}>{labels.riskScore}</Text>
                        <Text style={styles.expandedPrimaryValue}>
                          {displayPercent(model.riskScore)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.expandedMetricGrid}>
                      <MetricChip label={labels.singleAppointment} value={displayNumber(model.singleAppointmentClients)} accent={colors.gold} />
                      <MetricChip label={labels.repeatHistory} value={displayNumber(model.repeatHistoryClients)} accent={colors.green} />
                      <MetricChip label={labels.inactive} value={displayNumber(model.inactiveClients)} accent={colors.amber} />
                      <MetricChip label={labels.atRisk} value={displayNumber(model.atRiskClients)} accent={colors.amber} />
                      <MetricChip label={labels.highRisk} value={displayNumber(model.highRiskClients)} accent={colors.red} />
                      <MetricChip label={labels.lost} value={displayNumber(model.lostClients)} accent={colors.red} />
                    </View>

                    <Text style={styles.modalFootnote}>{labels.overlapNote}</Text>
                  </>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </DashboardThemeBackground>
      </Modal>
    </>
  );
}

function MetricChip({
  label,
  value,
  accent,
}: Readonly<{
  label: string;
  value: string;
  accent: string;
}>) {
  return (
    <View style={styles.metricChip} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.metricDot, { backgroundColor: accent }]} />
      <View style={styles.metricCopy}>
        <Text style={styles.metricChipValue}>{value}</Text>
        <Text style={styles.metricChipLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    shadowOpacity: 0.28,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 30,
    height: 30,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
  },
  modalSafe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 3, 12, 0.64)',
  },
  modalPanel: {
    width: '100%',
    maxWidth: 980,
    maxHeight: '92%',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.28,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 22 },
    elevation: 24,
  },
  modalAura: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 999,
    right: -180,
    top: -260,
    opacity: 0.72,
  },
  modalHeader: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    maxWidth: 720,
  },
  modalClose: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  expandedPrimaryRow: {
    flexDirection: 'row',
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  expandedPrimaryValue: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 7,
  },
  expandedMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  modalFootnote: {
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.royal,
    marginRight: 6,
  },
  badgeText: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stateBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.softSurface,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryRow: {
    flexDirection: 'row',
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.softSurface,
  },
  primaryMetric: {
    flex: 1,
    minWidth: 0,
  },
  primaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.softBorder,
    marginHorizontal: 14,
  },
  primaryLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  primaryValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metricChip: {
    width: '48%',
    minWidth: 120,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.softBorder,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: colors.softSurface,
  },
  metricDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 9,
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricChipValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  metricChipLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  footnote: {
    color: colors.textTertiary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 12,
  },
});

export default React.memo(ClientRetentionPulseV2);
