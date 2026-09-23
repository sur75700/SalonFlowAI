import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { UI } from "../../lib/theme/tokens";

import { t } from "../../lib/i18n";

import type {
  ReportDocument,
  ReportLocale,
} from "../../lib/reports/contracts";

type Props = {
  document: ReportDocument | null;
  locale: ReportLocale;
  loading?: boolean;
};

const DATA_TOKENS: Record<
  ReportLocale,
  Record<string, string>
> = {
  en: {},

  hy: {
    total: "ընդհանուր",
    appointment: "ամրագրում",
    appointments: "ամրագրումներ",
    client: "հաճախորդ",
    clients: "հաճախորդներ",
    service: "ծառայություն",
    services: "ծառայություններ",
    revenue: "եկամուտ",
    amount: "գումար",
    count: "քանակ",
    status: "կարգավիճակ",
    date: "ամսաթիվ",
    time: "ժամ",
    name: "անուն",
    currency: "արժույթ",
    scheduled: "պլանավորված",
    completed: "ավարտված",
    cancelled: "չեղարկված",
    duration: "տևողություն",
    minutes: "րոպեներ",
    hours: "ժամեր",
    capacity: "հզորություն",
    utilization: "օգտագործում",
    available: "հասանելի",
    booked: "ամրագրված",
    percent: "տոկոս",
    percentage: "տոկոս",
    average: "միջին",
    gross: "համախառն",
    net: "զուտ",
    unique: "եզակի",
    new: "նոր",
    returning: "վերադարձող",
    active: "ակտիվ",
    rate: "ցուցանիշ",
    start: "սկիզբ",
    end: "ավարտ",
    minor: "",
  },

  ru: {
    total: "всего",
    appointment: "запись",
    appointments: "записи",
    client: "клиент",
    clients: "клиенты",
    service: "услуга",
    services: "услуги",
    revenue: "выручка",
    amount: "сумма",
    count: "количество",
    status: "статус",
    date: "дата",
    time: "время",
    name: "название",
    currency: "валюта",
    scheduled: "запланировано",
    completed: "завершено",
    cancelled: "отменено",
    duration: "длительность",
    minutes: "минуты",
    hours: "часы",
    capacity: "мощность",
    utilization: "использование",
    available: "доступно",
    booked: "занято",
    percent: "процент",
    percentage: "процент",
    average: "среднее",
    gross: "валовая",
    net: "чистая",
    unique: "уникальные",
    new: "новые",
    returning: "возвращающиеся",
    active: "активные",
    rate: "показатель",
    start: "начало",
    end: "конец",
    minor: "",
  },

  fr: {
    total: "total",
    appointment: "rendez-vous",
    appointments: "rendez-vous",
    client: "client",
    clients: "clients",
    service: "service",
    services: "services",
    revenue: "revenus",
    amount: "montant",
    count: "nombre",
    status: "statut",
    date: "date",
    time: "heure",
    name: "nom",
    currency: "devise",
    scheduled: "planifié",
    completed: "terminé",
    cancelled: "annulé",
    duration: "durée",
    minutes: "minutes",
    hours: "heures",
    capacity: "capacité",
    utilization: "utilisation",
    available: "disponible",
    booked: "réservé",
    percent: "pourcentage",
    percentage: "pourcentage",
    average: "moyenne",
    gross: "brut",
    net: "net",
    unique: "uniques",
    new: "nouveaux",
    returning: "récurrents",
    active: "actifs",
    rate: "taux",
    start: "début",
    end: "fin",
    minor: "",
  },
};

const METRIC_ACCENTS = [
  "#72E0A8",
  "#67C2FF",
  "#CF8CFF",
  "#F2D17A",
  "#FF9E80",
  "#8B72FF",
];

const EXPLICIT_LABELS: Record<
  ReportLocale,
  Record<string, string>
> = {
  en: {
    currency: "Currency",
    completed_booking_count: "Completed bookings",
    gross_revenue_minor: "Gross revenue",
    previous_gross_revenue_minor: "Previous period revenue",
    average_ticket_minor: "Average ticket",
    total_client_count: "Total clients",
    new_client_count: "New clients",
    active_client_count: "Active clients",
    returning_client_count: "Returning clients",
    historically_active_client_count: "Historically active clients",
    at_risk_client_count: "At-risk clients",
    high_value_client_count: "High-value clients",
    completed_revenue_minor: "Completed revenue",
    total_service_count: "Total services",
    active_service_count: "Active services",
    total_slots: "Total capacity slots",
    booked_slots: "Booked slots",
    active_staff_count: "Active staff",
    available_minutes: "Available minutes",
    booked_minutes: "Booked minutes",
    start: "Start",
    client: "Client",
    service: "Service",
    status: "Status",
    notes: "Notes",
    service_id: "Service ID",
    name: "Service",
    catalog_present: "In catalog",
    is_active: "Active",
    duration_minutes: "Duration",
    configured_price_minor: "Listed price",
    appointment_count: "Appointments",
    scheduled_booking_count: "Scheduled bookings",
    cancelled_booking_count: "Cancelled bookings",
  },
  hy: {
    currency: "Արժույթ",
    completed_booking_count: "Ավարտված ամրագրումներ",
    gross_revenue_minor: "Համախառն եկամուտ",
    previous_gross_revenue_minor: "Նախորդ ժամանակահատվածի եկամուտ",
    average_ticket_minor: "Միջին չեկ",
    total_client_count: "Ընդհանուր հաճախորդներ",
    new_client_count: "Նոր հաճախորդներ",
    active_client_count: "Ակտիվ հաճախորդներ",
    returning_client_count: "Վերադարձող հաճախորդներ",
    historically_active_client_count: "Պատմականորեն ակտիվ հաճախորդներ",
    at_risk_client_count: "Ռիսկային խմբի հաճախորդներ",
    high_value_client_count: "Բարձր արժեք ունեցող հաճախորդներ",
    completed_revenue_minor: "Ավարտված եկամուտ",
    total_service_count: "Ընդհանուր ծառայություններ",
    active_service_count: "Ակտիվ ծառայություններ",
    total_slots: "Հզորության ընդհանուր տեղեր",
    booked_slots: "Ամրագրված տեղեր",
    active_staff_count: "Ակտիվ աշխատակիցներ",
    available_minutes: "Հասանելի րոպեներ",
    booked_minutes: "Ամրագրված րոպեներ",
    start: "Սկիզբ",
    client: "Հաճախորդ",
    service: "Ծառայություն",
    status: "Կարգավիճակ",
    notes: "Նշումներ",
    service_id: "Ծառայության ID",
    name: "Ծառայություն",
    catalog_present: "Կատալոգում",
    is_active: "Ակտիվ",
    duration_minutes: "Տևողություն",
    configured_price_minor: "Սահմանված գին",
    appointment_count: "Ամրագրումներ",
    scheduled_booking_count: "Պլանավորված ամրագրումներ",
    cancelled_booking_count: "Չեղարկված ամրագրումներ",
  },
  ru: {
    currency: "Валюта",
    completed_booking_count: "Завершенные записи",
    gross_revenue_minor: "Валовая выручка",
    previous_gross_revenue_minor: "Выручка за прошлый период",
    average_ticket_minor: "Средний чек",
    total_client_count: "Всего клиентов",
    new_client_count: "Новые клиенты",
    active_client_count: "Активные клиенты",
    returning_client_count: "Вернувшиеся клиенты",
    historically_active_client_count: "Исторически активные клиенты",
    at_risk_client_count: "Клиенты группы риска",
    high_value_client_count: "Ценные клиенты",
    completed_revenue_minor: "Завершенная выручка",
    total_service_count: "Всего услуг",
    active_service_count: "Активные услуги",
    total_slots: "Всего доступных слотов",
    booked_slots: "Занятые слоты",
    active_staff_count: "Активные сотрудники",
    available_minutes: "Доступные минуты",
    booked_minutes: "Занятые минуты",
    start: "Начало",
    client: "Клиент",
    service: "Услуга",
    status: "Статус",
    notes: "Заметки",
    service_id: "ID услуги",
    name: "Услуга",
    catalog_present: "В каталоге",
    is_active: "Активна",
    duration_minutes: "Длительность",
    configured_price_minor: "Указанная цена",
    appointment_count: "Записи",
    scheduled_booking_count: "Запланированные записи",
    cancelled_booking_count: "Отмененные записи",
  },
  fr: {
    currency: "Devise",
    completed_booking_count: "Rendez-vous terminés",
    gross_revenue_minor: "Revenus bruts",
    previous_gross_revenue_minor: "Revenus de la période précédente",
    average_ticket_minor: "Panier moyen",
    total_client_count: "Nombre total de clients",
    new_client_count: "Nouveaux clients",
    active_client_count: "Clients actifs",
    returning_client_count: "Clients de retour",
    historically_active_client_count: "Clients historiquement actifs",
    at_risk_client_count: "Clients à risque",
    high_value_client_count: "Clients à forte valeur",
    completed_revenue_minor: "Revenus terminés",
    total_service_count: "Nombre total de services",
    active_service_count: "Services actifs",
    total_slots: "Créneaux disponibles",
    booked_slots: "Créneaux réservés",
    active_staff_count: "Personnel actif",
    available_minutes: "Minutes disponibles",
    booked_minutes: "Minutes réservées",
    start: "Début",
    client: "Client",
    service: "Service",
    status: "Statut",
    notes: "Notes",
    service_id: "ID du service",
    name: "Service",
    catalog_present: "Dans le catalogue",
    is_active: "Actif",
    duration_minutes: "Durée",
    configured_price_minor: "Prix affiché",
    appointment_count: "Rendez-vous",
    scheduled_booking_count: "Rendez-vous planifiés",
    cancelled_booking_count: "Rendez-vous annulés",
  },
};

const BOOLEAN_LABELS: Record<
  ReportLocale,
  { true: string; false: string }
> = {
  en: { true: "Yes", false: "No" },
  hy: { true: "Այո", false: "Ոչ" },
  ru: { true: "Да", false: "Нет" },
  fr: { true: "Oui", false: "Non" },
};

const WARNING_LABELS: Record<
  ReportLocale,
  Record<string, string>
> = {
  en: {
    timezone_fallback_utc:
      "Salon timezone unavailable; UTC was used.",
  },
  hy: {
    timezone_fallback_utc:
      "Սրահի ժամային գոտին հասանելի չէր․ կիրառվել է UTC։",
  },
  ru: {
    timezone_fallback_utc:
      "Часовой пояс салона недоступен; использовано UTC.",
  },
  fr: {
    timezone_fallback_utc:
      "Le fuseau du salon est indisponible ; UTC a été utilisé.",
  },
};

function localizeStatus(
  value: string,
  locale: ReportLocale,
): string {
  if (
    value === "scheduled" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return t(
      `reports.commandCenter.statusValues.${value}`,
      locale,
    );
  }

  return value;
}

function displayValue(
  value: unknown,
  locale: ReportLocale,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (typeof value === "string") {
    return localizeStatus(
      value || "—",
      locale,
    );
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function displayMetricValue(
  key: string,
  value: unknown,
  locale: ReportLocale,
  currency?: string,
): string {
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat(
      locale === "hy" ? "en-US" : locale,
    ).format(value);

    return key.endsWith("_minor") && currency
      ? `${formatted} ${currency}`
      : formatted;
  }

  return displayValue(value, locale);
}

function displayRowValue(
  key: string,
  value: unknown,
  locale: ReportLocale,
  currency?: string,
): string {
  if (typeof value === "boolean") {
    return BOOLEAN_LABELS[locale][String(value) as "true" | "false"];
  }

  return displayMetricValue(
    key,
    value,
    locale,
    currency,
  );
}

function localizeWarning(
  warning: string,
  locale: ReportLocale,
): string {
  return WARNING_LABELS[locale][warning] ?? warning;
}

function dataLabel(
  key: string,
  locale: ReportLocale,
): string {
  const explicit = EXPLICIT_LABELS[locale][key];
  if (explicit) {
    return explicit;
  }

  const translated = key
    .split("_")
    .filter(Boolean)
    .map(
      (token) =>
        DATA_TOKENS[locale][
          token.toLowerCase()
        ] ?? token,
    )
    .filter(Boolean);

  const label =
    translated.join(" ");

  if (!label) {
    return key;
  }

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}

export default function ReportPreviewPanel({
  document,
  locale,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={styles.state}>
        <View style={styles.stateGlyph}>
          <Text
            style={styles.stateGlyphText}
          >
            ✦
          </Text>
        </View>

        <Text style={styles.stateTitle}>
          {t(
            "reports.commandCenter.buildingTitle",
            locale,
          )}
        </Text>

        <Text style={styles.stateText}>
          {t(
            "reports.commandCenter.buildingSubtitle",
            locale,
          )}
        </Text>
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.state}>
        <View style={styles.stateGlyph}>
          <Text
            style={styles.stateGlyphText}
          >
            ◇
          </Text>
        </View>

        <Text style={styles.stateTitle}>
          {t(
            "reports.commandCenter.noPreviewTitle",
            locale,
          )}
        </Text>

        <Text style={styles.stateText}>
          {t(
            "reports.commandCenter.noPreviewSubtitle",
            locale,
          )}
        </Text>
      </View>
    );
  }

  const metrics =
    Object.entries(
      document.metrics,
    );

  return (
    <View>
      <View style={styles.summaryGrid}>
        <View
          style={[
            styles.summaryCard,
            styles.summaryGold,
          ]}
        >
          <Text style={styles.label}>
            {t(
              "reports.commandCenter.totalRows",
              locale,
            )}
          </Text>

          <Text style={styles.value}>
            {document.total_rows}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            styles.summaryViolet,
          ]}
        >
          <Text style={styles.label}>
            {t(
              "reports.commandCenter.timezone",
              locale,
            )}
          </Text>

          <Text
            style={styles.valueSmall}
          >
            {document.period.timezone}
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            styles.summaryBlue,
          ]}
        >
          <Text style={styles.label}>
            {t(
              "reports.commandCenter.period",
              locale,
            )}
          </Text>

          <Text
            style={styles.valueSmall}
          >
            {document.period.start_date}
            {"  →  "}
            {document.period.end_date}
          </Text>
        </View>
      </View>

      {metrics.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>
            {t(
              "reports.commandCenter.metrics",
              locale,
            )}
          </Text>

          <View
            style={styles.metricsGrid}
          >
            {metrics.map(
              (
                [key, value],
                index,
              ) => {
                const accent =
                  METRIC_ACCENTS[
                    index %
                      METRIC_ACCENTS.length
                  ];

                return (
                  <View
                    key={key}
                    style={
                      styles.metricCard
                    }
                  >
                    <View
                      style={[
                        styles.metricAccent,
                        {
                          backgroundColor:
                            accent,
                        },
                      ]}
                    />

                    <Text
                      style={
                        styles.metricKey
                      }
                    >
                      {dataLabel(
                        key,
                        locale,
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.metricValue,
                        {
                          color: accent,
                        },
                      ]}
                    >
                      {displayMetricValue(
                        key,
                        value,
                        locale,
                        typeof document.metrics.currency ===
                          "string"
                          ? document.metrics.currency
                          : undefined,
                      )}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>
      ) : null}

      {document.warnings.length > 0 ? (
        <View
          style={styles.warningBlock}
        >
          <Text
            style={styles.warningTitle}
          >
            {t(
              "reports.commandCenter.warnings",
              locale,
            )}
          </Text>

          {document.warnings.map(
            (warning, index) => (
              <Text
                key={`${warning}-${index}`}
                style={styles.warningText}
              >
                • {localizeWarning(warning, locale)}
              </Text>
            ),
          )}
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {t(
            "reports.commandCenter.previewRows",
            locale,
          )}
        </Text>

        {document.rows.length === 0 ? (
          <View
            accessibilityLiveRegion="polite"
            style={styles.emptyState}
          >
            <Text
              style={styles.stateTitle}
            >
              {t(
                "reports.commandCenter.emptyTitle",
                locale,
              )}
            </Text>

            <Text
              style={styles.stateText}
            >
              {t(
                "reports.commandCenter.emptySubtitle",
                locale,
              )}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
          >
            <View>
              <View
                style={styles.tableRow}
              >
                {document.columns.map(
                  (column) => (
                    <View
                      key={column}
                      style={
                        styles.headerCell
                      }
                    >
                      <Text
                        style={
                          styles.headerText
                        }
                      >
                        {dataLabel(
                          column,
                          locale,
                        )}
                      </Text>
                    </View>
                  ),
                )}
              </View>

              {document.rows.map(
                (row, rowIndex) => (
                  <View
                    key={`row-${rowIndex}`}
                    style={
                      styles.tableRow
                    }
                  >
                    {row.map(
                      (
                        cell,
                        cellIndex,
                      ) => (
                        <View
                          key={`cell-${rowIndex}-${cellIndex}`}
                          style={
                            styles.cell
                          }
                        >
                          <Text
                            style={
                              styles.cellText
                            }
                            numberOfLines={
                              3
                            }
                          >
                            {displayRowValue(
                              document.columns[cellIndex],
                              cell,
                              locale,
                              typeof document.metrics.currency ===
                                "string"
                                ? document.metrics.currency
                                : undefined,
                            )}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                ),
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <Text style={styles.generated}>
        {t(
          "reports.commandCenter.generated",
          locale,
        )}{" "}
        {document.generated_at}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",

    backgroundColor:
      "#211D4A",

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.24)",

    borderRadius: 22,

    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  stateGlyph: {
    width: 52,
    height: 52,
    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 13,

    backgroundColor:
      "rgba(139,114,255,0.14)",

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.34)",
  },

  stateGlyphText: {
    color: "#B8A7FF",
    fontSize: 22,
    fontWeight: "900",
  },

  stateTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },

  stateText: {
    color: "#AAA7C0",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 560,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  summaryCard: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: "30%",

    borderRadius: 20,
    borderWidth: 1,

    padding: 15,
  },

  summaryGold: {
    backgroundColor:
      "#342C5E",
    borderColor:
      "rgba(242,209,122,0.34)",
  },

  summaryViolet: {
    backgroundColor:
      "#352D70",
    borderColor:
      "rgba(139,114,255,0.34)",
  },

  summaryBlue: {
    backgroundColor:
      "#302D68",
    borderColor:
      "rgba(103,194,255,0.34)",
  },

  label: {
    color: "#A9A4B9",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  value: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },

  valueSmall: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },

  block: {
    marginTop: 20,
  },

  blockTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 11,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metricCard: {
    position: "relative",
    overflow: "hidden",

    minWidth: 135,
    flexGrow: 1,
    flexBasis: "22%",

    backgroundColor:
      "#29245B",

    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.08)",

    padding: 14,
  },

  metricAccent: {
    position: "absolute",
    top: 0,
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 999,
  },

  metricKey: {
    color: "#9793AC",
    fontSize: 9,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 7,
  },

  metricValue: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  warningBlock: {
    marginTop: 18,

    backgroundColor:
      "rgba(242,209,122,0.10)",

    borderWidth: 1,
    borderColor:
      "rgba(242,209,122,0.34)",

    borderRadius: 18,
    padding: 15,
  },

  warningTitle: {
    color: "#F2D17A",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 7,
  },

  warningText: {
    color: "#E7DDAF",
    fontSize: 11,
    lineHeight: 17,
  },

  emptyState: {
    backgroundColor:
      "#211D4A",

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.22)",

    borderRadius: 18,
    padding: 18,
  },

  tableRow: {
    flexDirection: "row",
  },

  headerCell: {
    width: 155,
    minHeight: 44,

    justifyContent: "center",

    backgroundColor:
      "rgba(139,114,255,0.15)",

    borderWidth: 0.5,
    borderColor:
      "rgba(139,114,255,0.30)",

    paddingHorizontal: 10,
  },

  headerText: {
    color: "#DED8FF",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  cell: {
    width: 155,
    minHeight: 48,

    justifyContent: "center",

    backgroundColor:
      "#211D4A",

    borderWidth: 0.5,
    borderColor:
      UI.surface.border,

    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  cellText: {
    color: "#E0DCEA",
    fontSize: 11,
    lineHeight: 16,
  },

  generated: {
    color: "#77738A",
    fontSize: 9,
    marginTop: 11,
  },
});
