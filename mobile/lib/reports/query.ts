import type {
  ReportQuery,
} from "./contracts";

function encodePair(
  key: string,
  value: string,
): string {
  return (
    `${encodeURIComponent(key)}=` +
    encodeURIComponent(value)
  );
}

export function buildReportQueryString(
  query: ReportQuery,
): string {
  const pairs: string[] = [];

  const append = (
    key: string,
    value: string | undefined,
  ) => {
    if (value !== undefined) {
      pairs.push(encodePair(key, value));
    }
  };

  const appendMany = (
    key: string,
    values: readonly string[] | undefined,
  ) => {
    values?.forEach((value) => {
      pairs.push(encodePair(key, value));
    });
  };

  append("start_date", query.startDate);
  append("end_date", query.endDate);
  append("locale", query.locale);

  appendMany("status", query.status);
  appendMany("client_id", query.clientId);
  appendMany("service_id", query.serviceId);

  append("currency", query.currency);
  append("valuation_currency", query.valuationCurrency);
  append("theme", query.theme);

  return pairs.join("&");
}
