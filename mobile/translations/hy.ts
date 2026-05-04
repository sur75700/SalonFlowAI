const hy = {
  nav: {
    dashboard: "Վահանակ",
    bookings: "Ամրագրումներ",
    clients: "Հաճախորդներ",
    services: "Ծառայությունների ցանկ",
    insights: "Վերլուծություն",
    reports: "PDF հաշվետվություններ",
    workspace: "Աշխատանքային տարածք",
  },
  auth: {
    adminRecovery: "Ադմին սեսիայի վերականգնում",
    restoreSession: "Վերականգնել սեսիան",
    restoreSessionLoading: "Սեսիան վերականգնվում է...",
    loadAdminAccess: "Բացել ադմին մուտքը",
    email: "Էլ. հասցե",
    password: "Գաղտնաբառ",
    adminRecoveryBadge: "ԱԴՄԻՆ ՎԵՐԱԿԱՆԳՆՈՒՄ",
    helperTitle: "Ադմին վերականգնում",
    helperText:
      "Երբ ադմին token-ը ժամկետանց է դառնում, այս էկրանը օգնում է արագ վերականգնել անվտանգ մուտքը։",
  },
  session: {
    adminSessionActive: "Ադմին սեսիան ակտիվ է",
    closeSession: "Փակել սեսիան",
    closingSession: "Սեսիան փակվում է...",
    signedInAsPrefix: "Մուտք է գործված որպես",
    fallbackSignedIn: "SalonFlow AI-ի ադմին մուտքը ակտիվ է",
  },
  common: {
    today: "Այսօր",
    upcoming: "Սպասվող",
    total: "Ընդհանուր",
    active: "Ակտիվ",
    inactive: "Պասիվ",
    searchResults: "Որոնման արդյունքներ",
    clientSnapshot: "Հաճախորդների ամփոփում",
    executiveSnapshot: "Գլխավոր ամփոփում",
    exportReadiness: "Արտահանման պատրաստություն",
    operationsReady: "Օպերացիոն պատրաստվածություն",
    sessionActiveHelper: "Ձեր ադմին սեսիան ակտիվ է։ Թարմացրեք և համաժամեցրեք salon-ի վերջին ակտիվությունը։",
    clientsLabel: "Հաճախորդներ",
    servicesLabel: "Ծառայություններ",
    totalBookingsLabel: "Ընդհանուր ամրագրումներ",
    scheduledLabel: "Պլանավորված",
    completedLabel: "Ավարտված",
    cancelledLabel: "Չեղարկված",
    todayLabel: "Այսօր",
    selectedDate: "Ընտրված ամսաթիվ",
    exportState: "Արտահանման վիճակ",
    readyToExport: "Պատրաստ է արտահանման",
    generatingPdf: "PDF-ը գեներացվում է...",
  },
  dashboard: {
    title: "Վահանակ",
    heroSubtitle:
      "Պրեմիում salon կառավարման կենտրոն՝ ամրագրումների, հաճախորդների, ծառայությունների, վերլուծության և հաշվետվությունների համար։",
    commandNavigation: "Կառավարման նավիգացիա",
    commandNavigationSubtitle:
      "Շարժվեք հարթակում ըստ հստակ կառավարվող աշխատանքային բաժինների։",
    quickActions: "Արագ գործողություններ",
    quickActionsSubtitle:
      "Արագ անցում ձեր ամենակարևոր admin բաժիններին։",
    executiveSnapshotSubtitle:
      "Ձեր salon-ի ընթացիկ աշխատանքի իրական ժամանակի տեսքը։",
    executiveSnapshotTitle: "Գործադիր ամփոփում",
    commandNavigationTitle: "Կառավարման նավիգացիա",
    openBookings: "Բացել ամրագրումները",
    openClients: "Բացել հաճախորդները",
    openServiceCatalog: "Բացել ծառայությունների ցանկը",
    openInsights: "Բացել վերլուծությունը",
    openPdfReports: "Բացել PDF հաշվետվությունները",
  },
  bookings: {
    title: "Ամրագրումներ",
    heroSubtitle:
      "Կառավարեք ամրագրումները, փոխեք կարգավիճակները և պահեք salon-ի օրական հոսքը վերահսկելի։",
    bookingFilters: "Ամրագրումների ֆիլտրեր",
    bookingFiltersSubtitle:
      "Արագ անցեք ամրագրումների տարբեր գործառնական վիճակների միջև։",
    bookingRegistry: "Ամրագրումների ցուցակ",
    bookingRegistrySubtitle:
      "Որոնեք, ֆիլտրեք, թարմացրեք, ավարտեք, չեղարկեք կամ հեռացրեք ամրագրումները մեկ միջավայրից։",
  },
  clients: {
    title: "Հաճախորդների բազա",
    heroSubtitle:
      "Կառավարեք ձեր salon-ի ակտիվ հաճախորդներին մեկ կենտրոնացված միջավայրում։",
    snapshotSubtitle:
      "Արագ տեսք ձեր ակտիվ հաճախորդների բազային։",
    createClientEntry: "Ստեղծել հաճախորդ",
    manageClientRegistry: "Կառավարել հաճախորդների բազան",
    totalClients: "Ընդհանուր հաճախորդներ",
  },
  services: {
    title: "Ծառայությունների ցանկ",
    heroSubtitle:
      "Կառավարեք ձեր պրեմիում ծառայությունների ցանկը, գնային ռազմավարությունը, տևողությունը և ակտիվ վիճակը։",
    catalogSnapshot: "Ցանկի ամփոփում",
    catalogSnapshotSubtitle:
      "Արագ տեսք ձեր ընթացիկ ծառայությունների խառնուրդին։",
    createServiceEntry: "Ստեղծել ծառայություն",
    manageCatalogEntries: "Կառավարել ցանկը",
  },
  insights: {
    title: "Վերլուծություն",
    heroSubtitle:
      "Եկամտի պատկերացում, ծառայությունների արդյունավետություն և ամրագրումների կարգավիճակի վերլուծություն։",
    sessionReady: "Գործադիր վերլուծությունը պատրաստ է",
    revenueMomentum: "Եկամտի դինամիկա",
    revenueMomentumSubtitle:
      "Ավարտված եկամտի շարժը վերջին 7 օրում։",
    topRevenueServices: "Եկամտաբեր ծառայություններ",
    topRevenueServicesSubtitle:
      "Ամենաբարձր եկամուտ բերող ծառայությունների դասակարգում։",
    completedRevenue: "Ավարտված եկամուտ",
    scheduledPipeline: "Պլանավորված հոսք",
    cancelledValue: "Չեղարկված արժեք",
    avgCompletedTicket: "Միջին ավարտված չեկ",
    bookingStatusMix: "Ամրագրումների կարգավիճակներ",
    bookingStatusMixSubtitle:
      "Պլանավորված, ավարտված և չեղարկված ամրագրումների բաշխումը։",
  },
  reports: {
    title: "PDF հաշվետվություններ",
    heroSubtitle:
      "Արտահանեք օրական պրոֆեսիոնալ PDF հաշվետվություններ օպերացիոն, ֆինանսական և կառավարման տեսանկյունից։",
    dailyPdfExport: "Օրական PDF արտահանում",
    dailyPdfExportSubtitle:
      "Ստեղծեք և ներբեռնեք ընտրված օրվա պրոֆեսիոնալ PDF ամփոփումը։",
    reportingWorkflow: "Հաշվետվության ընթացք",
    reportingWorkflowSubtitle:
      "Օրական հաշվետվության պարզ արտահանման ընթացք։",
    stepPickDate: "1. Ընտրեք ամսաթիվը",
    stepPickDateSubtitle: "Օգտագործեք դաշտը կամ արագ կոճակները՝ հաշվետվության ամսաթիվը ընտրելու համար։",
    stepExportSummary: "2. Արտահանեք ամփոփումը",
    stepExportSummarySubtitle: "Համակարգը ներբեռնում է ձեր backend reports endpoint-ից ստեղծված PDF-ը։",
    stepReviewPerformance: "3. Վերանայեք salon-ի արդյունքները",
    stepReviewPerformanceSubtitle: "Հաշվետվությունը ներառում է ընտրված օրվա ընդհանուր տվյալներն ու ամրագրումները։",
  },
  workspace: {
    languageSwitcher: "Լեզվի ընտրություն",
    sessionLabel: "ՍԵՍԻԱ",
    operationsReady: "Օպերացիոն պատրաստվածություն",
    sessionActiveHelper: "Ձեր ադմին սեսիան ակտիվ է։ Թարմացրեք և համաժամեցրեք salon-ի վերջին ակտիվությունը։",
    clientsLabel: "Հաճախորդներ",
    servicesLabel: "Ծառայություններ",
    totalBookingsLabel: "Ընդհանուր ամրագրումներ",
    scheduledLabel: "Պլանավորված",
    completedLabel: "Ավարտված",
    cancelledLabel: "Չեղարկված",
    todayLabel: "Այսօր",
    title: "Աշխատանքային տարածք",
    heroSubtitle:
      "Կենտրոնական օգտակար տարածք նավիգացիայի, backend հասանելիության և admin գործառնությունների համար։",
    quickNavigation: "Արագ նավիգացիա",
    backendAccess: "Backend հասանելիություն",
    operatorNotes: "Օպերատորի նշումներ",
    openDashboard: "Բացել վահանակը",
    openApiDocs: "Բացել API docs-ը",
    checkBackendHealth: "Ստուգել backend-ի վիճակը",
    quickNavigationSubtitle: "Ընտրեք օպերացիոն ուղղությունը մեկ մաքուր կառավարման մակերևույթից։",
  },
};
export default hy;
