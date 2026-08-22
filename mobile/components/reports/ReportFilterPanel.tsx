import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { t } from "../../lib/i18n";

import type {
  ReportCatalog,
  ReportCatalogEntry,
  ReportFiatCurrency,
  ReportLocale,
  ReportStatus,
} from "../../lib/reports/contracts";

export type ReportFilterState = {
  startDate: string;
  endDate: string;
  statuses: ReportStatus[];
  clientIds: string;
  serviceIds: string;
  currency?: ReportFiatCurrency;
};

type Props = {
  catalog: ReportCatalog;
  definition: ReportCatalogEntry;
  value: ReportFilterState;
  locale: ReportLocale;
  disabled?: boolean;
  onChange: (
    value: ReportFilterState,
  ) => void;
};

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text style={styles.label}>
      {children}
    </Text>
  );
}

export default function ReportFilterPanel({
  catalog,
  definition,
  value,
  locale,
  disabled = false,
  onChange,
}: Props) {
  const supportsStatus =
    definition.filters.includes(
      "status",
    );

  const supportsClient =
    definition.filters.includes(
      "client_id",
    );

  const supportsService =
    definition.filters.includes(
      "service_id",
    );

  const startLabel =
    definition.period ===
    "single_calendar_date"
      ? t(
          "reports.commandCenter.reportDate",
          locale,
        )
      : t(
          "reports.commandCenter.startDate",
          locale,
        );

  const toggleStatus = (
    status: ReportStatus,
  ) => {
    const active =
      value.statuses.includes(status);

    onChange({
      ...value,
      statuses: active
        ? value.statuses.filter(
            (item) =>
              item !== status,
          )
        : [
            ...value.statuses,
            status,
          ],
    });
  };

  return (
    <View>
      <View style={styles.dateGrid}>
        <View style={styles.field}>
          <FieldLabel>
            {startLabel}
          </FieldLabel>

          <TextInput
            accessibilityLabel={
              startLabel
            }
            editable={!disabled}
            value={value.startDate}
            onChangeText={(startDate) =>
              onChange({
                ...value,
                startDate,
              })
            }
            placeholder={t(
              "reports.commandCenter.datePlaceholder",
              locale,
            )}
            placeholderTextColor="#746F86"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {definition.period ===
        "inclusive_calendar_date_range" ? (
          <View style={styles.field}>
            <FieldLabel>
              {t(
                "reports.commandCenter.endDate",
                locale,
              )}
            </FieldLabel>

            <TextInput
              accessibilityLabel={t(
                "reports.commandCenter.endDate",
                locale,
              )}
              editable={!disabled}
              value={value.endDate}
              onChangeText={(endDate) =>
                onChange({
                  ...value,
                  endDate,
                })
              }
              placeholder={t(
                "reports.commandCenter.datePlaceholder",
                locale,
              )}
              placeholderTextColor="#746F86"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.hint}>
        {t(
          "reports.commandCenter.dateHint",
          locale,
        )}
      </Text>

      {supportsStatus ? (
        <View style={styles.group}>
          <FieldLabel>
            {t(
              "reports.commandCenter.status",
              locale,
            )}
          </FieldLabel>

          <View style={styles.chips}>
            {catalog.status_values.map(
              (status) => {
                const active =
                  value.statuses.includes(
                    status,
                  );

                return (
                  <Pressable
                    key={status}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    onPress={() =>
                      toggleStatus(
                        status,
                      )
                    }
                    style={[
                      styles.chip,
                      active &&
                        styles.chipActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.chipDot,
                        active &&
                          styles.chipDotActive,
                      ]}
                    />

                    <Text
                      style={[
                        styles.chipText,
                        active &&
                          styles.chipTextActive,
                      ]}
                    >
                      {t(
                        `reports.commandCenter.statusValues.${status}`,
                        locale,
                      )}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
        </View>
      ) : null}

      {supportsClient ? (
        <View style={styles.group}>
          <FieldLabel>
            {t(
              "reports.commandCenter.clients",
              locale,
            )}
          </FieldLabel>

          <TextInput
            editable={!disabled}
            value={value.clientIds}
            onChangeText={(clientIds) =>
              onChange({
                ...value,
                clientIds,
              })
            }
            placeholder={t(
              "reports.commandCenter.idPlaceholder",
              locale,
            )}
            placeholderTextColor="#746F86"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.hint}>
            {t(
              "reports.commandCenter.idHint",
              locale,
            )}
          </Text>
        </View>
      ) : null}

      {supportsService ? (
        <View style={styles.group}>
          <FieldLabel>
            {t(
              "reports.commandCenter.services",
              locale,
            )}
          </FieldLabel>

          <TextInput
            editable={!disabled}
            value={value.serviceIds}
            onChangeText={(serviceIds) =>
              onChange({
                ...value,
                serviceIds,
              })
            }
            placeholder={t(
              "reports.commandCenter.idPlaceholder",
              locale,
            )}
            placeholderTextColor="#746F86"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.hint}>
            {t(
              "reports.commandCenter.idHint",
              locale,
            )}
          </Text>
        </View>
      ) : null}

      {definition.currency_mode ===
      "required_fiat" ? (
        <View style={styles.group}>
          <FieldLabel>
            {t(
              "reports.commandCenter.currency",
              locale,
            )}
          </FieldLabel>

          <View style={styles.chips}>
            {catalog.money
              .fiat_report_currencies
              .map((currency) => {
                const active =
                  value.currency ===
                  currency;

                return (
                  <Pressable
                    key={currency}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    onPress={() =>
                      onChange({
                        ...value,
                        currency,
                      })
                    }
                    style={[
                      styles.chip,
                      active &&
                        styles.chipGoldActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.chipDot,
                        active &&
                          styles.chipDotGold,
                      ]}
                    />

                    <Text
                      style={[
                        styles.chipText,
                        active &&
                          styles.chipTextActive,
                      ]}
                    >
                      {currency}
                    </Text>
                  </Pressable>
                );
              })}
          </View>

          <Text style={styles.hint}>
            {t(
              "reports.commandCenter.currencyHint",
              locale,
            )}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  field: {
    flexGrow: 1,
    minWidth: 190,
  },

  label: {
    color: "#C8C3D8",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  input: {
    minHeight: 48,
    backgroundColor:
      "#242052",
    color: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 11,

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.28)",
  },

  group: {
    marginTop: 18,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,

    backgroundColor:
      "#29245B",

    borderRadius: 999,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",

    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  chipActive: {
    backgroundColor:
      "#383074",
    borderColor:
      "rgba(139,114,255,0.72)",
  },

  chipGoldActive: {
    backgroundColor:
      "#393264",
    borderColor:
      "rgba(242,209,122,0.60)",
  },

  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#5F5A70",
  },

  chipDotActive: {
    backgroundColor: "#B8A7FF",
  },

  chipDotGold: {
    backgroundColor: "#F2D17A",
  },

  chipText: {
    color: "#BBB6C9",
    fontSize: 11,
    fontWeight: "800",
  },

  chipTextActive: {
    color: "#FFFFFF",
  },

  hint: {
    color: "#817C91",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
});
