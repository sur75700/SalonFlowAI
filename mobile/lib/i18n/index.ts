export type AppLanguage = "en" | "hy" | "ru" | "fr";
export type AppLocale = AppLanguage;
export type Locale = AppLanguage;
export type AppCurrency = "AMD" | "USD" | "EUR";

export const defaultLanguage: AppLanguage = "en";
export const defaultLocale: AppLocale = "en";
export const supportedLanguages: AppLanguage[] = ["en", "hy", "ru", "fr"];

export const languageLabels: Record<AppLanguage, string> = {
  en: "English",
  hy: "Հայերեն",
  ru: "Русский",
  fr: "Français",
};

const dict: Record<string, string> = {
  "Dashboard": "Dashboard",
  "Bookings": "Bookings",
  "Clients": "Clients",
  "Service Catalog": "Service Catalog",
  "Insights": "Insights",
  "Pdf Reports": "PDF Reports",
  "Command Navigation": "Command Navigation",
  "Command NavigationSubtitle": "Fast access to operational sections.",
  "Operations Ready": "Operations Ready",
  "Operations ReadySubtitle": "SalonFlow AI is online and ready.",
  "Catalog Ready": "Catalog Ready",
  "ServicesSessionReadySubtitle": "Service catalog is ready.",
  "Create ServiceEntry": "Create Service Entry",
  "Create ServiceEntrySubtitle": "Add a new service to the catalog.",
  "Service Name": "Service Name",
  "Duration Minutes": "Duration Minutes",
  "Price": "Price",
  "Create Service": "Create Service",
  "Edit": "Edit",
  "Delete": "Delete",
  "Cancel": "Cancel",
  "Working": "Working",
  "Active": "Active",
  "Inactive": "Inactive",
  "Analytics Ready": "Analytics Ready",
  "Analytics Ready Subtitle": "Analytics dashboard is ready.",
  "Revenue Trendline": "Revenue Trendline",
  "Revenue Trendline Subtitle": "Completed revenue over time.",
  "Top Performing Services": "Top Performing Services",
  "Top Performing Services Subtitle": "Services ranked by revenue.",
  "Booking Status Distribution": "Booking Status Distribution",
  "CompletedRevenue": "Completed Revenue",
  "ScheduledPipeline": "Scheduled Pipeline",
  "Cancelled Value": "Cancelled Value",
  "Avg Completed Ticket": "Avg Completed Ticket",
  "Executive Snapshot": "Executive Snapshot",
  "Executive Snapshot Analytics Subtitle": "High-level analytics summary.",
  "No Revenue Data Available": "No revenue data available",
  "No Revenue Data AvailableSubtitle": "Create completed bookings to see revenue.",
  "No Service Data Available": "No service data available",
  "No Service Data AvailableSubtitle": "Create services to see performance.",
  "Services": "Services",
  "Total Bookings": "Total Bookings",
  "Scheduled": "Scheduled",
  "Completed": "Completed",
  "Cancelled": "Cancelled",
  "Today": "Today",
  "Phone": "Phone",
  "Email": "Email",
  "Notes": "Notes",
  "Retry": "Retry",
  "Retrying": "Retrying...",
  "Exporting": "Exporting",
  "Dashboard sync needs attention": "Dashboard sync needs attention",
  "Client registry needs attention": "Client registry needs attention",
  "Service catalog needs attention": "Service catalog needs attention",
  "Booking flow needs attention": "Booking flow needs attention",
  "Analytics sync needs attention": "Analytics sync needs attention",
  "Report export needs attention": "Report export needs attention",
  "Review Performance Step Title": "3. Review salon performance",
  "Review Performance Step Subtitle": "The report includes totals and appointments for the selected day.",
};

export const translations = {
  en: dict,
  hy: dict,
  ru: dict,
  fr: dict,
};

export function t(key: string, locale: AppLanguage = defaultLanguage): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
