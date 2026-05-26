import { translations as nestedTranslations } from "../../translations";

export type AppLanguage = "en" | "hy" | "ru";
export type AppLocale = AppLanguage;
export type Locale = AppLanguage;
export type AppCurrency = "AMD" | "USD" | "EUR";

export const defaultLanguage: AppLanguage = "en";
export const defaultLocale: AppLocale = "en";
export const supportedLanguages: AppLanguage[] = ["en", "hy", "ru"];

export const languageLabels: Record<AppLanguage, string> = {
  en: "English",
  hy: "Հայերեն",
  ru: "Русский",
};


const bridgeMap: Record<string, string> = {
  "Dashboard": "dashboard.title",
  "Bookings": "bookings.title",
  "Clients": "nav.clients",
  "Service Catalog": "services.title",
  "Insights": "insights.title",
  "Pdf Reports": "reports.title",
  "Workspace": "workspace.title",

  "Operations Ready": "common.operationsReady",
  "Command Navigation": "dashboard.commandNavigation",
  "Command NavigationSubtitle": "dashboard.commandNavigationSubtitle",
  "Quick Actions": "dashboard.quickActions",
  "Quick Actions Subtitle": "dashboard.quickActionsSubtitle",
  "Executive Snapshot": "common.executiveSnapshot",
  "Executive Snapshot Subtitle": "dashboard.executiveSnapshotSubtitle",
  "Open Bookings": "dashboard.openBookings",
  "Open Clients": "dashboard.openClients",
  "Open Service Catalog": "dashboard.openServiceCatalog",
  "Open Insights": "dashboard.openInsights",
  "Open Pdf Reports": "dashboard.openPdfReports",
  "Dashboard Hero Subtitle": "dashboard.heroSubtitle",

  "Today": "common.today",
  "Total": "common.total",
  "Active": "common.active",
  "Inactive": "common.inactive",
  "Scheduled": "common.scheduledLabel",
  "Completed": "common.completedLabel",
  "Cancelled": "common.cancelledLabel",
  "Total Bookings": "common.totalBookingsLabel",
  "Total Clients": "clients.totalClients",
  "Total Services": "common.servicesLabel",
  "Services": "common.servicesLabel",
  "Selected Date": "common.selectedDate",
  "Export State": "common.exportState",
  "Ready To Export": "common.readyToExport",
  "Generating Pdf": "common.generatingPdf",

  "Analytics Hero Subtitle": "insights.heroSubtitle",
  "Analytics Ready": "insights.sessionReady",
  "CompletedRevenue": "insights.completedRevenue",
  "ScheduledPipeline": "insights.scheduledPipeline",
  "Cancelled Value": "insights.cancelledValue",
  "Avg Completed Ticket": "insights.avgCompletedTicket",
  "Revenue Trendline": "insights.revenueMomentum",
  "Revenue Trendline Subtitle": "insights.revenueMomentumSubtitle",
  "Top Performing Services": "insights.topRevenueServices",
  "Top Performing Services Subtitle": "insights.topRevenueServicesSubtitle",
  "Booking Status Distribution": "insights.bookingStatusMix",
  "Booking Status Distribution Subtitle": "insights.bookingStatusMixSubtitle",

  "Reports Hero Subtitle": "reports.heroSubtitle",
  "Daily Pdf Export": "reports.dailyPdfExport",
  "Daily Pdf Export Subtitle": "reports.dailyPdfExportSubtitle",
  "Reporting Workflow": "reports.reportingWorkflow",
  "Reporting WorkflowSubtitle": "reports.reportingWorkflowSubtitle",
  "Pick Date Step Title": "reports.stepPickDate",
  "Pick Date Step Subtitle": "reports.stepPickDateSubtitle",
  "Export Summary Step Title": "reports.stepExportSummary",
  "Export Summary Step Subtitle": "reports.stepExportSummarySubtitle",
  "Review Performance Step Title": "reports.stepReviewPerformance",
  "Review Performance Step Subtitle": "reports.stepReviewPerformanceSubtitle",

  "Client Snapshot": "common.clientSnapshot",
  "Client Registry Hero Subtitle": "clients.heroSubtitle",
  "Client Snapshot Subtitle": "clients.snapshotSubtitle",
  "Create ClientEntry": "clients.createClientEntry",

  "Service CatalogHeroSubtitle": "services.heroSubtitle",
  "Catalog Snapshot": "services.catalogSnapshot",
  "Catalog SnapshotSubtitle": "services.catalogSnapshotSubtitle",
  "Create ServiceEntry": "services.createServiceEntry",
};

function readNestedTranslation(locale: AppLanguage, path: string): string | undefined {
  const source = nestedTranslations[locale] ?? nestedTranslations.en;
  const value = path
    .split(".")
    .reduce<unknown>((acc, part) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[part];
    }, source);

  return typeof value === "string" ? value : undefined;
}

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
};

export function t(key: string, locale: AppLanguage = defaultLanguage): string {
  const bridgePath = bridgeMap[key];
  if (bridgePath) {
    const bridged = readNestedTranslation(locale, bridgePath);
    if (bridged) return bridged;
  }

  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
