import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  REPORT_VALUATION_CURRENCIES,
} from "../../lib/reports/contracts";

import type {
  ReportFiatCurrency,
  ReportLocale,
  ReportValuationCurrency,
} from "../../lib/reports/contracts";

import { UI } from "../../lib/theme/tokens";


type Props = {
  locale: ReportLocale;
  sourceCurrency?: ReportFiatCurrency;
  value?: ReportValuationCurrency;
  onChange: (
    value: ReportValuationCurrency | undefined,
  ) => void;
};


type Copy = {
  title: string;
  subtitle: string;
  original: string;
  originalHint: string;
  market: string;
  btcHint: string;
};


const COPY: Record<ReportLocale, Copy> = {
  en: {
    title: "Reporting valuation",
    subtitle:
      "Keep the original transaction currency or view this report at current market valuation.",
    original: "Original",
    originalHint: "Source",
    market: "Market valuation",
    btcHint:
      "BTC is a reference valuation, not a transaction currency.",
  },

  hy: {
    title: "Հաշվետվության գնահատման արժույթ",
    subtitle:
      "Պահպանեք սկզբնական գործարքի արժույթը կամ դիտեք հաշվետվությունը ընթացիկ շուկայական գնահատմամբ։",
    original: "Սկզբնական",
    originalHint: "Աղբյուր",
    market: "Շուկայական գնահատում",
    btcHint:
      "BTC-ն տեղեկատու շուկայական գնահատում է, ոչ գործարքի արժույթ։",
  },

  ru: {
    title: "Валюта оценки отчёта",
    subtitle:
      "Сохраните исходную валюту операции или просмотрите отчёт в текущей рыночной оценке.",
    original: "Исходная",
    originalHint: "Источник",
    market: "Рыночная оценка",
    btcHint:
      "BTC используется только как справочная рыночная оценка, а не валюта операции.",
  },

  fr: {
    title: "Devise de valorisation",
    subtitle:
      "Conservez la devise d’origine ou affichez le rapport selon la valorisation de marché actuelle.",
    original: "Originale",
    originalHint: "Source",
    market: "Valorisation de marché",
    btcHint:
      "Le BTC est une valorisation de référence, pas une devise de transaction.",
  },
};


export default function ReportValuationSelector({
  locale,
  sourceCurrency,
  value,
  onChange,
}: Props) {
  const copy = COPY[locale];

  const options: Array<
    ReportValuationCurrency | "ORIGINAL"
  > = [
    "ORIGINAL",
    ...REPORT_VALUATION_CURRENCIES,
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>
            {copy.title}
          </Text>

          <Text style={styles.subtitle}>
            {copy.subtitle}
          </Text>
        </View>

        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeLabel}>
            {copy.originalHint}
          </Text>

          <Text style={styles.sourceBadgeValue}>
            {sourceCurrency ?? "—"}
          </Text>
        </View>
      </View>

      <View style={styles.options}>
        {options.map((option) => {
          const original =
            option === "ORIGINAL";

          const selected = original
            ? value === undefined
            : value === option;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              accessibilityLabel={
                original
                  ? copy.original
                  : option === "BTC"
                    ? `BTC · ${copy.market}`
                    : option
              }
              onPress={() =>
                onChange(
                  original
                    ? undefined
                    : option,
                )
              }
              style={[
                styles.option,
                selected &&
                  styles.optionSelected,
                option === "BTC" &&
                  styles.btcOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected &&
                    styles.optionTextSelected,
                ]}
              >
                {original
                  ? copy.original
                  : option}
              </Text>

              {option === "BTC" ? (
                <Text style={styles.btcTag}>
                  {copy.market}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.disclosure}>
        <View style={styles.disclosureDot} />

        <Text style={styles.disclosureText}>
          {copy.btcHint}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,

    backgroundColor:
      UI.surface.cosmosStrong,

    borderColor:
      UI.surface.border,

    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },

  headerCopy: {
    flex: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 6,
    color: "#AAA7C0",
    fontSize: 12,
    lineHeight: 18,
  },

  sourceBadge: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",

    backgroundColor:
      "rgba(139,114,255,0.14)",

    borderWidth: 1,

    borderColor:
      "rgba(139,114,255,0.34)",
  },

  sourceBadgeLabel: {
    color: "#A9A4B9",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  sourceBadgeValue: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  options: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  option: {
    minHeight: 38,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.055)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.10)",
  },

  optionSelected: {
    backgroundColor:
      "rgba(139,114,255,0.23)",

    borderColor:
      "rgba(184,167,255,0.72)",
  },

  btcOption: {
    minWidth: 78,
  },

  optionText: {
    color: "#D7D3E4",
    fontSize: 12,
    fontWeight: "800",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  btcTag: {
    marginTop: 2,
    color: "#F2D17A",
    fontSize: 8,
    fontWeight: "700",
  },

  disclosure: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  disclosureDot: {
    width: 6,
    height: 6,
    marginTop: 5,
    borderRadius: 3,
    backgroundColor: "#F2D17A",
  },

  disclosureText: {
    flex: 1,
    color: "#A9A4B9",
    fontSize: 10,
    lineHeight: 15,
  },
});
