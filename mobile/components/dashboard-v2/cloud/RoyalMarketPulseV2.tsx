import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import type { MarketPulseResponse, MarketQuote, MarketQuoteState } from "../../../lib/market";
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

function formatRate(quote: MarketQuote, locale: string): string {
  if (quote.rate === null) return "—";
  try {
    const maximumFractionDigits = quote.pair === "BTC/USD" ? 2 : quote.pair === "RUB/AMD" ? 4 : 2;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits }).format(quote.rate)} ${quote.quote_currency}`;
  } catch {
    return `${quote.rate} ${quote.quote_currency}`;
  }
}

function formatChange(quote: MarketQuote): string {
  if (quote.change === null) return "—";
  const sign = quote.change > 0 ? "+" : "";
  return quote.change_type === "PERCENT"
    ? `${sign}${quote.change.toFixed(2)}%`
    : `${sign}${quote.change.toFixed(4)} ${quote.quote_currency}`;
}

function RoyalMarketPulseV2({ data, status, labels, locale, onRetry }: RoyalMarketPulseV2Props) {
  const { theme } = useDashboardTheme();
  const cardStyle = { backgroundColor: theme.palette.surface, borderColor: theme.palette.border };
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
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
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
        {status === "refreshing" ? <ActivityIndicator size="small" color={theme.palette.royal} /> : null}
      </View>
      <View style={styles.grid}>
        {(data?.quotes ?? []).map((quote) => (
          <View key={quote.pair} style={styles.quoteCard}>
            <View style={styles.quoteTopRow}>
              <Text style={styles.pair}>{quote.pair}</Text>
              <View style={[styles.statePill, quote.state === "STALE" ? styles.stalePill : quote.state === "UNAVAILABLE" ? styles.unavailablePill : styles.freshPill]}>
                <Text style={styles.statePillText}>{stateLabel(quote.state, labels)}</Text>
              </View>
            </View>
            <Text style={styles.rate}>{formatRate(quote, locale)}</Text>
            <Text style={[styles.change, quote.change !== null && quote.change < 0 ? styles.negative : styles.positive]}>{formatChange(quote)}</Text>
            <Text style={styles.source}>{labels.source}: {quote.source}</Text>
          </View>
        ))}
      </View>
      {status === "error" && data !== null ? (
        <View style={styles.retainedBanner}>
          <Text style={styles.retainedText}>{labels.unavailable}</Text>
          {onRetry ? <Pressable onPress={onRetry}><Text style={styles.retryInline}>{labels.retry}</Text></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 24, borderWidth: 1, padding: 18 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#E8C97A", fontSize: 11, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  subtitle: { marginTop: 6, color: "#A6A7C4", fontSize: 12, lineHeight: 18 },
  stateWrap: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: 12 },
  stateText: { color: "#F6F5FB", fontSize: 14, fontWeight: "700" },
  grid: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  quoteCard: { width: "50%", padding: 10, borderWidth: 5, borderColor: "transparent", backgroundColor: "rgba(13,14,30,0.48)", borderRadius: 18 },
  quoteTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pair: { color: "#D7C6FF", fontSize: 11, fontWeight: "800" },
  statePill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  freshPill: { backgroundColor: "rgba(63,207,142,0.13)" },
  stalePill: { backgroundColor: "rgba(242,184,75,0.14)" },
  unavailablePill: { backgroundColor: "rgba(242,97,122,0.14)" },
  statePillText: { color: "#D8D9E8", fontSize: 8, fontWeight: "800" },
  rate: { marginTop: 10, color: "#F8F7FD", fontSize: 17, fontWeight: "800" },
  change: { marginTop: 3, fontSize: 10, fontWeight: "700" },
  positive: { color: "#3FCF8E" },
  negative: { color: "#F2617A" },
  source: { marginTop: 8, color: "#6F7092", fontSize: 9, fontWeight: "600" },
  retryButton: { marginTop: 14, alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: "rgba(124,92,255,0.45)", paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: "#D7C6FF", fontSize: 11, fontWeight: "800" },
  retainedBanner: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", borderRadius: 12, backgroundColor: "rgba(242,184,75,0.08)", padding: 10 },
  retainedText: { color: "#F2B84B", fontSize: 10, fontWeight: "700" },
  retryInline: { color: "#D7C6FF", fontSize: 10, fontWeight: "800" },
});

export default React.memo(RoyalMarketPulseV2);
