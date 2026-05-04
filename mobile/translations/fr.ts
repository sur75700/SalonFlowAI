const fr = {
  nav: {
    dashboard: "Tableau de bord",
    bookings: "Réservations",
    clients: "Clients",
    services: "Catalogue des services",
    insights: "Analytique",
    reports: "Rapports PDF",
    workspace: "Espace de travail",
  },
  auth: {
    adminRecovery: "Récupération de session admin",
    restoreSession: "Restaurer la session",
    restoreSessionLoading: "Restauration de la session...",
    loadAdminAccess: "Ouvrir l'accès admin",
    email: "Email",
    password: "Mot de passe",
    adminRecoveryBadge: "RÉCUPÉRATION ADMIN",
    helperTitle: "Récupération admin",
    helperText:
      "Lorsque le token admin expire, cet écran aide à restaurer rapidement un accès sécurisé.",
  },
  session: {
    adminSessionActive: "Session admin active",
    closeSession: "Fermer la session",
    closingSession: "Fermeture de la session...",
    signedInAsPrefix: "Connecté en tant que",
    fallbackSignedIn: "L'accès admin SalonFlow AI est actif",
  },
  common: {
    today: "Aujourd'hui",
    upcoming: "À venir",
    total: "Total",
    active: "Actif",
    inactive: "Inactif",
    searchResults: "Résultats de recherche",
    clientSnapshot: "Résumé clients",
    executiveSnapshot: "Résumé exécutif",
    exportReadiness: "Prêt pour l’export",
    operationsReady: "Opérations prêtes",
    sessionActiveHelper: "Votre session admin est active. Actualisez et synchronisez la dernière activité du salon.",
    clientsLabel: "Clients",
    servicesLabel: "Services",
    totalBookingsLabel: "Réservations totales",
    scheduledLabel: "Planifiées",
    completedLabel: "Terminées",
    cancelledLabel: "Annulées",
    todayLabel: "Aujourd'hui",
    selectedDate: "Date sélectionnée",
    exportState: "État de l’export",
    readyToExport: "Prêt à exporter",
    generatingPdf: "Génération du PDF...",
  },
  dashboard: {
    title: "Tableau de bord",
    heroSubtitle:
      "Centre de commande premium pour gérer les réservations, clients, services, analyses et rapports.",
    commandNavigation: "Navigation de commande",
    commandNavigationSubtitle:
      "Naviguez dans la plateforme via des espaces de travail ciblés.",
    quickActions: "Actions rapides",
    quickActionsSubtitle:
      "Accédez rapidement à vos flux administratifs les plus importants.",
    executiveSnapshotSubtitle:
      "Vue en temps réel de l’activité actuelle de votre salon.",
    executiveSnapshotTitle: "Résumé exécutif",
    commandNavigationTitle: "Navigation de commande",
    openBookings: "Ouvrir les réservations",
    openClients: "Ouvrir les clients",
    openServiceCatalog: "Ouvrir le catalogue des services",
    openInsights: "Ouvrir l’analytique",
    openPdfReports: "Ouvrir les rapports PDF",
  },
  bookings: {
    title: "Réservations",
    heroSubtitle:
      "Gérez les réservations, mettez à jour les statuts et gardez le flux quotidien du salon sous contrôle.",
    bookingFilters: "Filtres des réservations",
    bookingFiltersSubtitle:
      "Basculez rapidement entre les différents états opérationnels des réservations.",
    bookingRegistry: "Registre des réservations",
    bookingRegistrySubtitle:
      "Recherchez, filtrez, mettez à jour, terminez, annulez ou supprimez des réservations depuis une seule interface.",
  },
  clients: {
    title: "Registre clients",
    heroSubtitle:
      "Gérez votre base active de clients dans un espace de travail ciblé.",
    snapshotSubtitle:
      "Vue rapide de votre base active de clients.",
    createClientEntry: "Créer un client",
    manageClientRegistry: "Gérer le registre clients",
    totalClients: "Total clients",
  },
  services: {
    title: "Catalogue des services",
    heroSubtitle:
      "Gérez votre catalogue premium, votre stratégie tarifaire, la durée et l’état actif des services.",
    catalogSnapshot: "Résumé du catalogue",
    catalogSnapshotSubtitle:
      "Vue rapide de votre structure actuelle de services.",
    createServiceEntry: "Créer un service",
    manageCatalogEntries: "Gérer le catalogue",
  },
  insights: {
    title: "Analytique",
    heroSubtitle:
      "Intelligence des revenus, performance des services et analyse des statuts de réservation.",
    sessionReady: "Analytique exécutive prête",
    revenueMomentum: "Dynamique des revenus",
    revenueMomentumSubtitle:
      "Évolution des revenus finalisés sur les 7 derniers jours.",
    topRevenueServices: "Meilleurs services par revenu",
    topRevenueServicesSubtitle:
      "Services les plus performants classés par contribution au revenu.",
    completedRevenue: "Revenu finalisé",
    scheduledPipeline: "Pipeline planifié",
    cancelledValue: "Valeur annulée",
    avgCompletedTicket: "Ticket moyen finalisé",
    bookingStatusMix: "Statuts des réservations",
    bookingStatusMixSubtitle:
      "Répartition des réservations planifiées, terminées et annulées.",
  },
  reports: {
    title: "Rapports PDF",
    heroSubtitle:
      "Exportez des rapports PDF quotidiens soignés pour l’exploitation, la revue financière et la gestion.",
    dailyPdfExport: "Export PDF quotidien",
    dailyPdfExportSubtitle:
      "Générez et téléchargez un résumé PDF soigné pour la date sélectionnée.",
    reportingWorkflow: "Flux de reporting",
    reportingWorkflowSubtitle:
      "Flux simple d’export pour le reporting quotidien.",
    stepPickDate: "1. Choisir une date",
    stepPickDateSubtitle: "Utilisez le champ de saisie ou les boutons rapides pour sélectionner la date du rapport.",
    stepExportSummary: "2. Exporter le résumé",
    stepExportSummarySubtitle: "Le système télécharge un PDF généré par votre endpoint backend de rapports.",
    stepReviewPerformance: "3. Revoir la performance du salon",
    stepReviewPerformanceSubtitle: "Le rapport inclut les totaux et les réservations pour la date sélectionnée.",
  },
  workspace: {
    languageSwitcher: "Changement de langue",
    sessionLabel: "SESSION",
    operationsReady: "Opérations prêtes",
    sessionActiveHelper: "Votre session admin est active. Actualisez et synchronisez la dernière activité du salon.",
    clientsLabel: "Clients",
    servicesLabel: "Services",
    totalBookingsLabel: "Réservations totales",
    scheduledLabel: "Planifiées",
    completedLabel: "Terminées",
    cancelledLabel: "Annulées",
    todayLabel: "Aujourd'hui",
    title: "Espace de travail",
    heroSubtitle:
      "Espace utilitaire central pour la navigation, l’accès backend et les opérations administratives.",
    quickNavigation: "Navigation rapide",
    backendAccess: "Accès backend",
    operatorNotes: "Notes opérateur",
    openDashboard: "Ouvrir le tableau de bord",
    openApiDocs: "Ouvrir la documentation API",
    checkBackendHealth: "Vérifier l’état du backend",
    quickNavigationSubtitle: "Choisissez une route opérationnelle depuis une surface de contrôle propre.",
  },
};
export default fr;
