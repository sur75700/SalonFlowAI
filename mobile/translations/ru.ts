const ru = {
  nav: {
    dashboard: "Панель",
    bookings: "Записи",
    clients: "Клиенты",
    services: "Каталог услуг",
    insights: "Аналитика",
    reports: "PDF отчеты",
    workspace: "Рабочее пространство",
  },
  auth: {
    adminRecovery: "Восстановление админ-сессии",
    restoreSession: "Восстановить сессию",
    restoreSessionLoading: "Восстановление сессии...",
    loadAdminAccess: "Открыть админ-доступ",
    email: "Email",
    password: "Пароль",
    adminRecoveryBadge: "ВОССТАНОВЛЕНИЕ АДМИНА",
    helperTitle: "Восстановление админа",
    helperText:
      "Когда admin token истекает, этот экран помогает быстро восстановить безопасный доступ.",
  },
  session: {
    adminSessionActive: "Админ-сессия активна",
    closeSession: "Закрыть сессию",
    closingSession: "Сессия закрывается...",
    signedInAsPrefix: "Вход выполнен как",
    fallbackSignedIn: "Админ-доступ SalonFlow AI активен",
  },
  common: {
    today: "Сегодня",
    upcoming: "Предстоящие",
    total: "Всего",
    active: "Активные",
    inactive: "Неактивные",
    searchResults: "Результаты поиска",
    clientSnapshot: "Сводка по клиентам",
    executiveSnapshot: "Главная сводка",
    exportReadiness: "Готовность к экспорту",
    operationsReady: "Операционная готовность",
    sessionActiveHelper: "Ваша админ-сессия активна. Обновите экран и синхронизируйте последнюю активность салона.",
    clientsLabel: "Клиенты",
    servicesLabel: "Услуги",
    totalBookingsLabel: "Всего записей",
    scheduledLabel: "Запланировано",
    completedLabel: "Завершено",
    cancelledLabel: "Отменено",
    todayLabel: "Сегодня",
    selectedDate: "Выбранная дата",
    exportState: "Состояние экспорта",
    readyToExport: "Готово к экспорту",
    generatingPdf: "Генерация PDF...",
  },
  dashboard: {
    title: "Панель",
    heroSubtitle:
      "Премиальный центр управления салоном для записей, клиентов, услуг, аналитики и отчетности.",
    commandNavigation: "Навигация управления",
    commandNavigationSubtitle:
      "Перемещайтесь по платформе через сфокусированные рабочие разделы.",
    quickActions: "Быстрые действия",
    quickActionsSubtitle:
      "Быстрый переход к самым важным административным рабочим зонам.",
    executiveSnapshotSubtitle:
      "Картина текущей работы вашего салона в реальном времени.",
    executiveSnapshotTitle: "Исполнительная сводка",
    commandNavigationTitle: "Навигация управления",
    openBookings: "Открыть записи",
    openClients: "Открыть клиентов",
    openServiceCatalog: "Открыть каталог услуг",
    openInsights: "Открыть аналитику",
    openPdfReports: "Открыть PDF отчеты",
  },
  bookings: {
    title: "Записи",
    heroSubtitle:
      "Управляйте записями, меняйте статусы и держите ежедневный поток салона под контролем.",
    bookingFilters: "Фильтры записей",
    bookingFiltersSubtitle:
      "Быстро переключайтесь между рабочими статусами записей.",
    bookingRegistry: "Реестр записей",
    bookingRegistrySubtitle:
      "Ищите, фильтруйте, обновляйте, завершайте, отменяйте или удаляйте записи из одной рабочей зоны.",
  },
  clients: {
    title: "Реестр клиентов",
    heroSubtitle:
      "Управляйте активной клиентской базой салона в одном рабочем пространстве.",
    snapshotSubtitle:
      "Быстрый обзор активной клиентской базы салона.",
    createClientEntry: "Создать клиента",
    manageClientRegistry: "Управлять реестром клиентов",
    totalClients: "Всего клиентов",
  },
  services: {
    title: "Каталог услуг",
    heroSubtitle:
      "Управляйте премиальным каталогом услуг, ценовой стратегией, длительностью и активным состоянием.",
    catalogSnapshot: "Сводка каталога",
    catalogSnapshotSubtitle:
      "Быстрый обзор текущей структуры ваших услуг.",
    createServiceEntry: "Создать услугу",
    manageCatalogEntries: "Управлять каталогом",
  },
  insights: {
    title: "Аналитика",
    heroSubtitle:
      "Аналитика выручки, эффективности услуг и статусов записей.",
    sessionReady: "Исполнительная аналитика готова",
    revenueMomentum: "Динамика выручки",
    revenueMomentumSubtitle:
      "Движение завершенной выручки за последние 7 дней.",
    topRevenueServices: "Топ услуг по выручке",
    topRevenueServicesSubtitle:
      "Услуги с наибольшим вкладом в выручку.",
    completedRevenue: "Завершенная выручка",
    scheduledPipeline: "Запланированный поток",
    cancelledValue: "Стоимость отмен",
    avgCompletedTicket: "Средний завершенный чек",
    bookingStatusMix: "Статусы записей",
    bookingStatusMixSubtitle:
      "Распределение запланированных, завершенных и отмененных записей.",
  },
  reports: {
    title: "PDF отчеты",
    heroSubtitle:
      "Экспортируйте профессиональные ежедневные PDF-отчеты для операций, финансового обзора и управления.",
    dailyPdfExport: "Ежедневный PDF экспорт",
    dailyPdfExportSubtitle:
      "Создайте и скачайте профессиональный PDF-отчет за выбранную дату.",
    reportingWorkflow: "Процесс отчетности",
    reportingWorkflowSubtitle:
      "Простой процесс экспорта ежедневной отчетности.",
    stepPickDate: "1. Выберите дату",
    stepPickDateSubtitle: "Используйте поле ввода или быстрые кнопки для выбора даты отчета.",
    stepExportSummary: "2. Экспортируйте сводку",
    stepExportSummarySubtitle: "Система скачивает PDF, созданный вашим backend reports endpoint.",
    stepReviewPerformance: "3. Оцените показатели салона",
    stepReviewPerformanceSubtitle: "Отчет включает итоги и записи за выбранную дату.",
  },
  workspace: {
    languageSwitcher: "Переключение языка",
    sessionLabel: "СЕССИЯ",
    operationsReady: "Операционная готовность",
    sessionActiveHelper: "Ваша админ-сессия активна. Обновите экран и синхронизируйте последнюю активность салона.",
    clientsLabel: "Клиенты",
    servicesLabel: "Услуги",
    totalBookingsLabel: "Всего записей",
    scheduledLabel: "Запланировано",
    completedLabel: "Завершено",
    cancelledLabel: "Отменено",
    todayLabel: "Сегодня",
    title: "Рабочее пространство",
    heroSubtitle:
      "Центральное рабочее пространство для навигации, доступа к backend и административных операций.",
    quickNavigation: "Быстрая навигация",
    backendAccess: "Доступ к backend",
    operatorNotes: "Заметки оператора",
    openDashboard: "Открыть панель",
    openApiDocs: "Открыть API docs",
    checkBackendHealth: "Проверить состояние backend",
    quickNavigationSubtitle: "Выберите операционный маршрут с одной чистой панели управления.",
  },
};
export default ru;
