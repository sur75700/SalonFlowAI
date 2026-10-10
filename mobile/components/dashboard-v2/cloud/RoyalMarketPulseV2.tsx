import React from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import {
  MARKET_DISPLAY_CURRENCIES,
  buildReferenceMarketPanels,
  deriveMarketCrossRate,
  type ReferenceMarketPanelQuote,
  type MarketDisplayCurrency,
  type MarketPulseResponse,
  type MarketQuoteState,
} from "../../../lib/market";
import type { MarketPulseStatus } from "../../../hooks/useMarketPulse";

export type RoyalMarketPulseLabels = Readonly<{
  title: string;
  subtitle: string;
  fresh: string;
  stale: string;
  unavailable: string;
  loading: string;
  refreshing: string;
  retry: string;
  source: string;
  inspect: string;
  referenceRate: string;
  from: string;
  to: string;
  derived: string;
  derivedNote: string;
  conversionUnavailable: string;
  close: string;
  expand: string;
  fullView: string;
  referenceCurrency: string;
  referenceMatrixNote: string;
}>;

export type RoyalMarketPulseV2Props = Readonly<{
  data: MarketPulseResponse | null;
  status: MarketPulseStatus;
  labels: RoyalMarketPulseLabels;
  locale: string;
  onRetry?: () => void;
}>;

function stateLabel(state: MarketQuoteState, labels: RoyalMarketPulseLabels): string {
  if (state === "FRESH") return labels.fresh;
  if (state === "STALE") return labels.stale;
  return labels.unavailable;
}

type MarketPanelQuote = ReferenceMarketPanelQuote;

const MARKET_CURRENCY_SYMBOLS: Readonly<Record<MarketDisplayCurrency, string>> = Object.freeze({
  AMD: "֏",
  USD: "$",
  EUR: "€",
  RUB: "₽",
  BTC: "₿",
});

function currencyChipLabel(currency: MarketDisplayCurrency): string {
  return `${MARKET_CURRENCY_SYMBOLS[currency]} ${currency}`;
}

function formatPanelRate(quote: MarketPanelQuote, locale: string): string {
  if (quote.rate === null) return "—";
  return `${formatReferenceRate(quote.rate, quote.quote_currency, locale)} ${quote.quote_currency}`;
}

function formatPanelChange(quote: MarketPanelQuote, locale: string): string {
  if (quote.change === null && quote.change_percent === null) return "—";

  const directionValue =
    quote.change !== null && quote.change !== 0
      ? quote.change
      : quote.change_percent ?? 0;
  const direction = directionValue > 0 ? "▲" : directionValue < 0 ? "▼" : "•";
  const pieces: string[] = [];

  if (quote.change !== null) {
    const sign = quote.change > 0 ? "+" : "";
    pieces.push(
      `${sign}${formatReferenceRate(quote.change, quote.quote_currency, locale)} ${quote.quote_currency}`,
    );
  }

  if (quote.change_percent !== null) {
    const sign = quote.change_percent > 0 ? "+" : "";
    pieces.push(`${sign}${quote.change_percent.toFixed(2)}%`);
  }

  return `${direction} ${pieces.join(" · ")}`;
}

function formatReferenceRate(
  value: number,
  currency: MarketDisplayCurrency,
  locale: string,
): string {
  const absolute = Math.abs(value);
  const maximumFractionDigits =
    currency === "BTC"
      ? 8
      : currency === "RUB"
        ? 4
        : absolute >= 100
          ? 2
          : absolute >= 1
            ? 4
            : 6;

  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toFixed(Math.min(maximumFractionDigits, 6));
  }
}

function fallbackQuoteCurrency(base: MarketDisplayCurrency): MarketDisplayCurrency {
  return MARKET_DISPLAY_CURRENCIES.find((currency) => currency !== base) ?? "AMD";
}

function ExpandGlyph() {
  return (
    <View style={styles.expandGlyph} pointerEvents="none">
      <View style={[styles.expandCorner, styles.expandCornerTopLeft]} />
      <View style={[styles.expandCorner, styles.expandCornerTopRight]} />
      <View style={[styles.expandCorner, styles.expandCornerBottomLeft]} />
      <View style={[styles.expandCorner, styles.expandCornerBottomRight]} />
    </View>
  );
}

function RoyalMarketPulseV2({ data, status, labels, locale, onRetry }: RoyalMarketPulseV2Props) {
  const { theme } = useDashboardTheme();
  const { width, height } = useWindowDimensions();
  const [expanded, setExpanded] = React.useState(false);
  const [selectedBase, setSelectedBase] = React.useState<MarketDisplayCurrency | null>(null);
  const [selectedQuote, setSelectedQuote] = React.useState<MarketDisplayCurrency | null>(null);
  const [compactReference, setCompactReference] = React.useState<MarketDisplayCurrency>("AMD");
  const [fullscreenReference, setFullscreenReference] = React.useState<MarketDisplayCurrency>("AMD");

  const cardStyle = { backgroundColor: theme.palette.surface, borderColor: theme.palette.border };
  const compactPanels = React.useMemo(
    () => (data ? buildReferenceMarketPanels(data, compactReference) : []),
    [data, compactReference],
  );
  const detailRate = React.useMemo(() => {
    if (!data || !selectedBase || !selectedQuote) return null;
    return deriveMarketCrossRate(data, selectedBase, selectedQuote);
  }, [data, selectedBase, selectedQuote]);
  const fullscreenPanels = React.useMemo(
    () => (data ? buildReferenceMarketPanels(data, fullscreenReference) : []),
    [data, fullscreenReference],
  );

  const openQuote = (quote: Pick<MarketPanelQuote, "base_currency" | "quote_currency">) => {
    setSelectedBase(quote.base_currency);
    setSelectedQuote(quote.quote_currency);
  };

  const chooseBase = (currency: MarketDisplayCurrency) => {
    setSelectedBase(currency);
    setSelectedQuote((current) =>
      current === currency || current === null ? fallbackQuoteCurrency(currency) : current,
    );
  };

  const chooseQuote = (currency: MarketDisplayCurrency) => {
    setSelectedQuote(currency);
    setSelectedBase((current) =>
      current === currency || current === null ? fallbackQuoteCurrency(currency) : current,
    );
  };

  const chooseCompactReference = (currency: MarketDisplayCurrency) => {
    setCompactReference(currency);
    setSelectedBase(null);
    setSelectedQuote(null);
  };

  const chooseFullscreenReference = (currency: MarketDisplayCurrency) => {
    const nextBase =
      selectedBase && selectedBase !== currency
        ? selectedBase
        : fallbackQuoteCurrency(currency);
    setFullscreenReference(currency);
    setSelectedBase(nextBase);
    setSelectedQuote(currency);
  };

  const chooseFullscreenQuote = (currency: MarketDisplayCurrency) => {
    chooseQuote(currency);
    setFullscreenReference(currency);
  };

  const openExpanded = () => {
    const reference = compactReference;
    const nextBase =
      selectedBase && selectedQuote === reference && selectedBase !== reference
        ? selectedBase
        : fallbackQuoteCurrency(reference);
    setFullscreenReference(reference);
    setSelectedBase(nextBase);
    setSelectedQuote(reference);
    setExpanded(true);
  };

  if ((status === "idle" || status === "loading") && data === null) {
    return (
      <View style={[styles.shell, cardStyle]}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={theme.palette.royal} />
          <Text style={styles.stateText}>{labels.loading}</Text>
        </View>
      </View>
    );
  }

  if (status === "error" && data === null) {
    return (
      <View style={[styles.shell, cardStyle]}>
        <Text style={styles.eyebrow}>{labels.title}</Text>
        <Text style={styles.stateText}>{labels.unavailable}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.retry}
            onPress={onRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>{labels.retry}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.shell, cardStyle]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{labels.title}</Text>
          <Text style={styles.subtitle}>{labels.subtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          {status === "refreshing" ? <ActivityIndicator size="small" color={theme.palette.royal} /> : null}
          <Pressable
            testID="market-pulse-expand"
            accessibilityRole="button"
            accessibilityLabel={labels.expand}
            hitSlop={8}
            onPress={openExpanded}
            style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
          >
            <ExpandGlyph />
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {compactPanels.map((quote) => {
          const active = selectedBase === quote.base_currency && selectedQuote === quote.quote_currency;
          const directionValue =
            quote.change !== null && quote.change !== 0
              ? quote.change
              : quote.change_percent ?? 0;
          return (
            <Pressable
              key={quote.pair}
              testID={`market-quote-${quote.pair}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${quote.pair}. ${labels.inspect}`}
              onPress={() => openQuote(quote)}
              style={({ pressed }) => [
                styles.quoteCard,
                active && styles.quoteCardActive,
                pressed && styles.quoteCardPressed,
              ]}
            >
              <View style={styles.quoteTopRow}>
                <View style={styles.pairWrap}>
                  <Text style={styles.pair}>{quote.pair}</Text>
                  {quote.derived ? (
                    <Text style={styles.derivedBadge}>{labels.derived}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.statePill,
                    quote.state === "STALE"
                      ? styles.stalePill
                      : quote.state === "UNAVAILABLE"
                        ? styles.unavailablePill
                        : styles.freshPill,
                  ]}
                >
                  <Text style={styles.statePillText}>{stateLabel(quote.state, labels)}</Text>
                </View>
              </View>
              <Text style={styles.rate}>{formatPanelRate(quote, locale)}</Text>
              <Text
                style={[
                  styles.change,
                  directionValue < 0
                    ? styles.negative
                    : directionValue > 0
                      ? styles.positive
                      : styles.neutral,
                ]}
              >
                {formatPanelChange(quote, locale)}
              </Text>
              <Text style={styles.provenance} numberOfLines={2}>
                {quote.derived
                  ? `${labels.derived}: ${quote.source_pairs.join(" × ")}`
                  : `${labels.source}: ${quote.sources.join(" + ")}`}
              </Text>
              <View style={styles.quoteFooter}>
                <Text style={styles.source}>{quote.sources.join(" + ")}</Text>
                <Text style={styles.inspectText}>{labels.inspect} ›</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View testID="market-inline-reference-switcher" style={styles.inlineReferenceSwitcher}>
        {MARKET_DISPLAY_CURRENCIES.map((currency) => {
          const active = currency === compactReference;
          return (
            <Pressable
              key={`inline-reference-${currency}`}
              testID={`market-inline-reference-${currency}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => chooseCompactReference(currency)}
              style={({ pressed }) => [
                styles.inlineReferenceChip,
                active && styles.inlineReferenceChipActive,
                pressed && styles.currencyChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.inlineReferenceChipText,
                  active && styles.inlineReferenceChipTextActive,
                ]}
              >
                {currencyChipLabel(currency)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {status === "error" && data !== null ? (
        <View style={styles.retainedBanner}>
          <Text style={styles.retainedText}>{labels.unavailable}</Text>
          {onRetry ? (
            <Pressable accessibilityRole="button" accessibilityLabel={labels.retry} onPress={onRetry}>
              <Text style={styles.retryInline}>{labels.retry}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <View
          testID="market-pulse-modal"
          style={[
            styles.modalBackdrop,
            {
              paddingHorizontal: width < 700 ? 10 : 28,
              paddingVertical: height < 700 ? 10 : 24,
            },
          ]}
        >
          <View
            style={[
              styles.modalShell,
              {
                maxHeight: Math.max(420, height - (height < 700 ? 20 : 48)),
                borderColor: theme.palette.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalEyebrow}>{labels.title.toUpperCase()}</Text>
                <Text style={styles.modalTitle}>{labels.fullView}</Text>
                <Text style={styles.modalSubtitle}>{labels.subtitle}</Text>
              </View>
              <Pressable
                testID="market-pulse-close"
                accessibilityRole="button"
                accessibilityLabel={labels.close}
                hitSlop={10}
                onPress={() => setExpanded(false)}
                style={({ pressed }) => [styles.modalCloseButton, pressed && styles.modalCloseButtonPressed]}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator
            >
              <View testID="market-reference-matrix" style={styles.referenceMatrix}>
                <View style={styles.referenceMatrixCopy}>
                  <Text style={styles.referenceMatrixLabel}>{labels.referenceCurrency}</Text>
                  <Text style={styles.referenceMatrixNote}>{labels.referenceMatrixNote}</Text>
                </View>
                <View style={styles.referenceCurrencyRow}>
                  {MARKET_DISPLAY_CURRENCIES.map((currency) => {
                    const active = currency === fullscreenReference;
                    return (
                      <Pressable
                        key={`reference-${currency}`}
                        testID={`market-reference-${currency}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => chooseFullscreenReference(currency)}
                        style={({ pressed }) => [
                          styles.referenceCurrencyChip,
                          active && styles.referenceCurrencyChipActive,
                          pressed && styles.currencyChipPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.referenceCurrencyChipText,
                            active && styles.referenceCurrencyChipTextActive,
                          ]}
                        >
                          {currencyChipLabel(currency)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fullscreenGrid}>
                {fullscreenPanels.map((quote) => {
                  const active = selectedBase === quote.base_currency && selectedQuote === quote.quote_currency;
                  const directionValue =
                    quote.change !== null && quote.change !== 0
                      ? quote.change
                      : quote.change_percent ?? 0;
                  const provenance =
                    quote.sources.length === 0
                      ? labels.conversionUnavailable
                      : quote.derived
                        ? `${labels.derived}: ${quote.source_pairs.join(" × ")}`
                        : `${labels.source}: ${quote.sources.join(" + ")}`;
                  return (
                    <Pressable
                      key={`fullscreen-${quote.pair}`}
                      testID={`market-fullscreen-quote-${quote.pair}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${quote.pair}. ${labels.inspect}`}
                      onPress={() => openQuote(quote)}
                      style={({ pressed }) => [
                        styles.fullscreenQuoteCard,
                        width < 720 && styles.fullscreenQuoteCardNarrow,
                        active && styles.quoteCardActive,
                        pressed && styles.quoteCardPressed,
                      ]}
                    >
                      <View style={styles.quoteTopRow}>
                        <View style={styles.pairWrap}>
                          <Text style={styles.fullscreenPair}>{quote.pair}</Text>
                          {quote.derived ? <Text style={styles.derivedBadge}>{labels.derived}</Text> : null}
                        </View>
                        <View
                          style={[
                            styles.statePill,
                            quote.state === "STALE"
                              ? styles.stalePill
                              : quote.state === "UNAVAILABLE"
                                ? styles.unavailablePill
                                : styles.freshPill,
                          ]}
                        >
                          <Text style={styles.statePillText}>{stateLabel(quote.state, labels)}</Text>
                        </View>
                      </View>
                      <Text style={styles.fullscreenRate}>{formatPanelRate(quote, locale)}</Text>
                      <Text
                        style={[
                          styles.fullscreenChange,
                          directionValue < 0
                            ? styles.negative
                            : directionValue > 0
                              ? styles.positive
                              : styles.neutral,
                        ]}
                      >
                        {formatPanelChange(quote, locale)}
                      </Text>
                      <Text style={styles.fullscreenProvenance}>{provenance}</Text>
                      <View style={styles.quoteFooter}>
                        <Text style={styles.source}>
                          {quote.sources.length > 0 ? quote.sources.join(" + ") : "—"}
                        </Text>
                        <Text style={styles.inspectText}>{labels.inspect} ›</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {selectedBase && selectedQuote ? (
                <View
                  testID="market-fullscreen-detail-panel"
                  style={[
                    styles.fullscreenDetailPanel,
                    { borderColor: theme.palette.border },
                  ]}
                >
                  <View style={styles.detailHeader}>
                    <View style={styles.detailHeaderCopy}>
                      <Text style={styles.detailEyebrow}>{labels.referenceRate}</Text>
                      <Text style={styles.fullscreenDetailPair}>{selectedBase}/{selectedQuote}</Text>
                    </View>
                  </View>

                  <Text style={styles.fullscreenDetailRate}>
                    {detailRate
                      ? `1 ${selectedBase} = ${formatReferenceRate(detailRate.rate, selectedQuote, locale)} ${selectedQuote}`
                      : "—"}
                  </Text>

                  <View style={[styles.fullscreenSelectors, width >= 760 && styles.fullscreenSelectorsWide]}>
                    <View style={[styles.fullscreenSelectorBlock, width >= 760 && styles.fullscreenSelectorHalf]}>
                      <Text style={styles.selectorLabel}>{labels.from}</Text>
                      <View style={styles.currencyRow}>
                        {MARKET_DISPLAY_CURRENCIES.map((currency) => {
                          const active = currency === selectedBase;
                          return (
                            <Pressable
                              key={`fullscreen-base-${currency}`}
                              testID={`market-fullscreen-base-${currency}`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                              onPress={() => chooseBase(currency)}
                              style={({ pressed }) => [
                                styles.fullscreenCurrencyChip,
                                active && styles.currencyChipActive,
                                pressed && styles.currencyChipPressed,
                              ]}
                            >
                              <Text style={[styles.fullscreenCurrencyChipText, active && styles.currencyChipTextActive]}>
                                {currencyChipLabel(currency)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={[styles.fullscreenSelectorBlock, width >= 760 && styles.fullscreenSelectorHalf]}>
                      <Text style={styles.selectorLabel}>{labels.to}</Text>
                      <View style={styles.currencyRow}>
                        {MARKET_DISPLAY_CURRENCIES.map((currency) => {
                          const active = currency === selectedQuote;
                          const sameAsBase = currency === selectedBase;
                          return (
                            <Pressable
                              key={`fullscreen-quote-${currency}`}
                              testID={`market-fullscreen-quote-currency-${currency}`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active, disabled: sameAsBase }}
                              disabled={sameAsBase}
                              onPress={() => chooseFullscreenQuote(currency)}
                              style={({ pressed }) => [
                                styles.fullscreenCurrencyChip,
                                active && styles.currencyChipActive,
                                sameAsBase && styles.currencyChipDisabled,
                                pressed && !sameAsBase && styles.currencyChipPressed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.fullscreenCurrencyChipText,
                                  active && styles.currencyChipTextActive,
                                  sameAsBase && styles.currencyChipTextDisabled,
                                ]}
                              >
                                {currencyChipLabel(currency)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  {detailRate ? (
                    <View style={styles.detailMeta}>
                      <View
                        style={[
                          styles.statePill,
                          detailRate.state === "STALE" ? styles.stalePill : styles.freshPill,
                        ]}
                      >
                        <Text style={styles.statePillText}>{stateLabel(detailRate.state, labels)}</Text>
                      </View>
                      <Text style={styles.detailSource}>
                        {labels.source}: {detailRate.sources.length > 0 ? detailRate.sources.join(" + ") : "—"}
                      </Text>
                      {detailRate.source_pairs.length > 1 ? (
                        <Text style={styles.derivedText}>
                          {labels.derived}: {detailRate.source_pairs.join(" → ")}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.conversionUnavailable}>{labels.conversionUnavailable}</Text>
                  )}

                  <Text style={styles.fullscreenDerivedNote}>{labels.derivedNote}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 24, borderWidth: 1, padding: 18 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  expandButton: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: "rgba(232,201,122,0.30)", backgroundColor: "rgba(255,255,255,0.035)", alignItems: "center", justifyContent: "center" },
  expandButtonPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  expandGlyph: { width: 14, height: 14 },
  expandCorner: { position: "absolute", width: 6, height: 6, borderColor: "#E8C97A" },
  expandCornerTopLeft: { left: 0, top: 0, borderLeftWidth: 1.5, borderTopWidth: 1.5 },
  expandCornerTopRight: { right: 0, top: 0, borderRightWidth: 1.5, borderTopWidth: 1.5 },
  expandCornerBottomLeft: { left: 0, bottom: 0, borderLeftWidth: 1.5, borderBottomWidth: 1.5 },
  expandCornerBottomRight: { right: 0, bottom: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5 },
  eyebrow: { color: "#E8C97A", fontSize: 11, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  subtitle: { marginTop: 6, color: "#A6A7C4", fontSize: 12, lineHeight: 18 },
  stateWrap: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 12 },
  stateText: { color: "#F6F5FB", fontSize: 14, fontWeight: "700" },
  grid: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  inlineReferenceSwitcher: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  inlineReferenceChip: {
    minWidth: 68,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineReferenceChipActive: {
    borderColor: "rgba(232,201,122,0.72)",
    backgroundColor: "rgba(232,201,122,0.10)",
  },
  inlineReferenceChipText: { color: "#A6A7C4", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  inlineReferenceChipTextActive: { color: "#F4D98E" },
  quoteCard: {
    width: "50%",
    padding: 10,
    borderWidth: 5,
    borderColor: "transparent",
    backgroundColor: "rgba(13,14,30,0.48)",
    borderRadius: 18,
  },
  quoteCardActive: { backgroundColor: "rgba(124,92,255,0.16)", borderColor: "rgba(112,231,255,0.34)" },
  quoteCardPressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  quoteTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pairWrap: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  pair: { color: "#D7C6FF", fontSize: 11, fontWeight: "800" },
  derivedBadge: { color: "#70E7FF", fontSize: 8, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  statePill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  freshPill: { backgroundColor: "rgba(63,207,142,0.13)" },
  stalePill: { backgroundColor: "rgba(242,184,75,0.14)" },
  unavailablePill: { backgroundColor: "rgba(242,97,122,0.14)" },
  statePillText: { color: "#D8D9E8", fontSize: 8, fontWeight: "800" },
  rate: { marginTop: 10, color: "#F8F7FD", fontSize: 17, fontWeight: "800" },
  change: { marginTop: 3, fontSize: 10, fontWeight: "700" },
  positive: { color: "#3FCF8E" },
  negative: { color: "#F2617A" },
  neutral: { color: "#A6A7C4" },
  provenance: { marginTop: 7, color: "#8C8DAA", fontSize: 8, lineHeight: 12, fontWeight: "700" },
  quoteFooter: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  source: { color: "#6F7092", fontSize: 9, fontWeight: "600" },
  inspectText: { color: "#AFA0FF", fontSize: 9, fontWeight: "800" },
  detailPanel: { marginTop: 14, borderRadius: 20, borderWidth: 1, padding: 16 },
  detailHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  detailHeaderCopy: { flex: 1, minWidth: 0 },
  detailEyebrow: { color: "#A6A7C4", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  detailPair: { marginTop: 4, color: "#F8F7FD", fontSize: 16, fontWeight: "900" },
  detailClose: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  detailClosePressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  detailCloseText: { color: "#F8F7FD", fontSize: 22, lineHeight: 24, fontWeight: "300" },
  detailRate: { marginTop: 10, color: "#E8FCFF", fontSize: 22, lineHeight: 28, fontWeight: "900", letterSpacing: -0.3 },
  selectorBlock: { marginTop: 14 },
  selectorLabel: { color: "#A6A7C4", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  currencyRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  currencyChip: { minWidth: 48, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.035)", paddingHorizontal: 11, paddingVertical: 7, alignItems: "center" },
  currencyChipActive: { borderColor: "rgba(112,231,255,0.48)", backgroundColor: "rgba(124,92,255,0.18)" },
  currencyChipPressed: { opacity: 0.74 },
  currencyChipDisabled: { opacity: 0.28 },
  currencyChipText: { color: "#A6A7C4", fontSize: 10, fontWeight: "800" },
  currencyChipTextActive: { color: "#E8FCFF" },
  currencyChipTextDisabled: { color: "#6F7092" },
  detailMeta: { marginTop: 14, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  detailSource: { color: "#8C8DAA", fontSize: 9, fontWeight: "700" },
  derivedText: { color: "#8C8DAA", fontSize: 9, fontWeight: "700" },
  derivedNote: { marginTop: 10, color: "#6F7092", fontSize: 9, lineHeight: 14, fontWeight: "600" },
  conversionUnavailable: { marginTop: 14, color: "#F2B84B", fontSize: 10, lineHeight: 15, fontWeight: "700" },
  modalBackdrop: { flex: 1, justifyContent: "center", backgroundColor: "rgba(2, 3, 12, 0.78)" },
  modalShell: { width: "100%", maxWidth: 1220, alignSelf: "center", borderRadius: 30, borderWidth: 1, backgroundColor: "rgba(10, 12, 32, 0.94)", overflow: "hidden" },
  modalHeader: { minHeight: 78, paddingHorizontal: 22, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.025)" },
  modalTitleBlock: { flex: 1, minWidth: 0, paddingRight: 14 },
  modalEyebrow: { color: "#E8C97A", fontSize: 10, fontWeight: "800", letterSpacing: 1.25 },
  modalTitle: { marginTop: 3, color: "#F8F7FD", fontSize: 22, lineHeight: 28, fontWeight: "900", letterSpacing: -0.3 },
  modalSubtitle: { marginTop: 4, color: "#A6A7C4", fontSize: 11, lineHeight: 16 },
  modalCloseButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.055)", alignItems: "center", justifyContent: "center" },
  modalCloseButtonPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  modalCloseText: { marginTop: -2, color: "#F8F7FD", fontSize: 26, lineHeight: 28, fontWeight: "400" },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { padding: 18, paddingBottom: 24 },
  referenceMatrix: { marginBottom: 16, borderRadius: 22, borderWidth: 1, borderColor: "rgba(112,231,255,0.18)", backgroundColor: "rgba(124,92,255,0.07)", padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  referenceMatrixCopy: { flex: 1, minWidth: 220 },
  referenceMatrixLabel: { color: "#E8C97A", fontSize: 10, fontWeight: "900", letterSpacing: 0.9, textTransform: "uppercase" },
  referenceMatrixNote: { marginTop: 5, color: "#A6A7C4", fontSize: 10, lineHeight: 15, fontWeight: "600" },
  referenceCurrencyRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  referenceCurrencyChip: { minWidth: 72, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.035)", paddingHorizontal: 14, paddingVertical: 9, alignItems: "center" },
  referenceCurrencyChipActive: { borderColor: "rgba(232,201,122,0.72)", backgroundColor: "rgba(232,201,122,0.12)" },
  referenceCurrencyChipText: { color: "#A6A7C4", fontSize: 11, fontWeight: "900" },
  referenceCurrencyChipTextActive: { color: "#FFF1BD" },
  fullscreenGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 },
  fullscreenQuoteCard: { width: "50%", minHeight: 156, padding: 18, borderWidth: 7, borderColor: "transparent", backgroundColor: "rgba(13,14,30,0.54)", borderRadius: 22 },
  fullscreenQuoteCardNarrow: { width: "100%" },
  fullscreenPair: { color: "#D7C6FF", fontSize: 13, fontWeight: "900" },
  fullscreenRate: { marginTop: 14, color: "#F8F7FD", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  fullscreenChange: { marginTop: 5, fontSize: 12, fontWeight: "800" },
  fullscreenProvenance: { marginTop: 10, color: "#8C8DAA", fontSize: 10, lineHeight: 15, fontWeight: "700" },
  fullscreenDetailPanel: { marginTop: 18, borderRadius: 24, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.035)", padding: 22 },
  fullscreenDetailPair: { marginTop: 4, color: "#F8F7FD", fontSize: 20, lineHeight: 26, fontWeight: "900" },
  fullscreenDetailRate: { marginTop: 14, color: "#E8FCFF", fontSize: 30, lineHeight: 38, fontWeight: "900", letterSpacing: -0.5 },
  fullscreenSelectors: { marginTop: 4 },
  fullscreenSelectorsWide: { flexDirection: "row", gap: 18 },
  fullscreenSelectorBlock: { marginTop: 14 },
  fullscreenSelectorHalf: { flex: 1, minWidth: 0 },
  fullscreenCurrencyChip: { minWidth: 72, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.035)", paddingHorizontal: 14, paddingVertical: 9, alignItems: "center" },
  fullscreenCurrencyChipText: { color: "#A6A7C4", fontSize: 11, fontWeight: "800" },
  fullscreenDerivedNote: { marginTop: 14, color: "#6F7092", fontSize: 10, lineHeight: 16, fontWeight: "600" },
  retryButton: { marginTop: 14, alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: "rgba(124,92,255,0.45)", paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: "#D7C6FF", fontSize: 11, fontWeight: "800" },
  retainedBanner: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", borderRadius: 12, backgroundColor: "rgba(242,184,75,0.08)", padding: 10 },
  retainedText: { color: "#F2B84B", fontSize: 10, fontWeight: "700" },
  retryInline: { color: "#D7C6FF", fontSize: 10, fontWeight: "800" },
});

export default React.memo(RoyalMarketPulseV2);
