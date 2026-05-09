import type { AppLocale } from "./types";

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

const translations: Record<AppLocale, TranslationTree> = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      create: "Create",
      total: "Total",
      active: "Active",
      inactive: "Inactive",
      today: "Today",
      yesterday: "Yesterday",
      upcoming: "Upcoming",
      scheduled: "Scheduled",
      completed: "Completed",
      cancelled: "Cancelled",
      working: "Working...",
      creating: "Creating...",

      client: "Client",
      clients: "Clients",
      fullName: "Full name",
      phone: "Phone",
      email: "Email",
      notes: "Notes",
      createClient: "Create Client",
      createClientEntry: "Create Client Entry",
      clientSnapshot: "Client Snapshot",
      noClientsYet: "No clients yet",
      noMatchingClients: "No matching clients",
      searchClients: "Search clients...",

      bookings: "Bookings",
      createAppointment: "Create Appointment",
      bookingTime: "Booking time",
      startTime: "Start time",
      selectClient: "Select client",
      selectService: "Select service",
      bookingNotes: "Booking notes",
      todayBookings: "Today bookings",
      upcomingBookings: "Upcoming bookings",
      bookingFilters: "Booking Filters",
      bookingRegistry: "Booking Registry",
      noAppointmentsYet: "No appointments yet",
      noMatchingAppointments: "No matching appointments",
      searchAppointments: "Search appointments...",
      nextHour: "Next hour",
      resetForm: "Reset Form",
      complete: "Complete",
      all: "All",

      dashboard: "Dashboard",
      operationsReady: "Operations Ready",
      commandNavigation: "Command Navigation",
      quickActions: "Quick Actions",
      executiveSnapshot: "Executive Snapshot",
      insights: "Insights",
      appointments: "Appointments",
      serviceCatalog: "Service Catalog",
      totalClients: "Total clients",
      totalServices: "Total services",
      totalBookings: "Total bookings",
      scheduledBookings: "Scheduled bookings",
      completedBookings: "Completed bookings",
      cancelledBookings: "Cancelled bookings",

      workspace: "Workspace",
      quickNavigation: "Quick Navigation",
      openDashboard: "Open Dashboard",
      openBookings: "Open Bookings",
      openClients: "Open Clients",
      openServiceCatalog: "Open Service Catalog",
      openInsights: "Open Insights",
      openPdfReports: "Open PDF Reports",
      openApiDocs: "Open API Docs",
      checkBackendHealth: "Check Backend Health",

      pdfReports: "PDF Reports",
      reportsReady: "Reports Ready",
      dailyPdfExport: "Daily PDF Export",
      exportReadiness: "Export Readiness",
      exportPdfReport: "Export PDF Report",
      reportingWorkflow: "Reporting Workflow",
      selectedDate: "Selected date",
      exportState: "Export state",
      generatingPdf: "Generating PDF...",
      readyToExport: "Ready to export",

      catalogReady: "Catalog Ready",
      createServiceEntry: "Create Service Entry",
      catalogSnapshot: "Catalog Snapshot",
      noServicesYet: "No services yet",
      noMatchingServices: "No matching services",
      serviceName: "Service name",
      durationInMinutes: "Duration in minutes",
      price: "Price",
      currency: "Currency",
      createService: "Create Service",
      searchServices: "Search services...",

      bookingsTab: "Bookings",
      clientsTab: "Clients",
      insightsTab: "Insights",

      requiredFields: "Required fields are missing",
      serviceFieldsRequired: "Service name, duration and price are required",
      bookingFieldsRequired: "Client, service and booking time are required",
      bookingStartRequired: "Client, service and start datetime are required",
      createdSuccessfully: "Created successfully",
      updatedSuccessfully: "Updated successfully",
      deletedSuccessfully: "Deleted successfully",
      completedSuccessfully: "Completed successfully",
      cancelledSuccessfully: "Cancelled successfully",
      serviceAddedSuccessfully: "Service added to catalog successfully",
      serviceUpdatedSuccessfully: "Service catalog entry updated successfully",
      serviceDeletedSuccessfully: "Service removed from catalog successfully",
      bookingCreatedSuccessfully: "Appointment created successfully",
      bookingUpdatedSuccessfully: "Booking details updated successfully",
      bookingCompletedSuccessfully: "Booking marked completed",
      bookingCancelledSuccessfully: "Booking cancelled",
      bookingDeletedSuccessfully: "Booking deleted successfully",
      deleteServiceTitle: "Delete service?",
      deleteAppointmentTitle: "Delete appointment?",
      sessionExpiredSignIn: "Session expired. Sign in first.",
      failedToExportPdf: "Failed to export PDF",
      exportUiWebOnly: "PDF export from UI is currently enabled for web.",

      bookingFlowConnected: "Booking Flow Connected",
      createAppointmentSubtitle:
        "Create a new salon booking with client, service, date, and notes.",
      todayBookingsSubtitle: "Live same-day appointment flow.",
      noBookingsToday: "No bookings today",
      noBookingsTodaySubtitle:
        "Today has no scheduled appointments right now.",
      upcomingBookingsSubtitle: "Next scheduled client flow.",
      noUpcomingBookings: "No upcoming bookings",
      noUpcomingBookingsSubtitle:
        "There are no future appointments scheduled yet.",
      bookingFiltersSubtitle:
        "Switch between operational booking states instantly.",
      bookingRegistrySubtitle:
        "Search, filter, update, complete, cancel, or remove bookings from one control surface.",
      noAppointmentsYetSubtitle:
        "Create your first booking using the appointment form above.",
      noMatchingAppointmentsSubtitle:
        "Try another search term or switch the active filter.",
      selectStatus: "Select status",
      deleteServiceMessagePrefix: "This will permanently remove ",
      deleteServiceMessageSuffix: " from your catalog.",
      deleteBookingMessagePrefix: "This booking for ",
      deleteBookingMessageSuffix: " will be permanently deleted.",
      servicesSessionReadySubtitle:
        "Your session is active and can manage pricing, duration, and service visibility.",
      createServiceEntrySubtitle:
        "Add a premium salon service to your catalog.",
      catalogSnapshotSubtitle:
        "Fast visibility into your current service mix.",
      serviceCatalogSubtitle:
        "Search, edit, activate, deactivate, and manage salon services.",
      noServicesYetSubtitle:
        "Create your first salon service to start accepting bookings.",
      noMatchingServicesSubtitle:
        "Try another search term or clear the search field.",
    },
  },

  hy: {
    common: {
      save: "Պահպանել",
      cancel: "Չեղարկել",
      delete: "Ջնջել",
      edit: "Խմբագրել",
      search: "Որոնել",
      create: "Ստեղծել",
      total: "Ընդամենը",
      active: "Ակտիվ",
      inactive: "Պասիվ",
      today: "Այսօր",
      yesterday: "Երեկ",
      upcoming: "Առաջիկա",
      scheduled: "Պլանավորված",
      completed: "Ավարտված",
      cancelled: "Չեղարկված",
      working: "Ընթացքում...",
      creating: "Ստեղծվում է...",

      client: "Հաճախորդ",
      clients: "Հաճախորդներ",
      fullName: "Լրիվ անուն",
      phone: "Հեռախոս",
      email: "Էլ. փոստ",
      notes: "Նշումներ",
      createClient: "Ստեղծել հաճախորդ",
      createClientEntry: "Ստեղծել հաճախորդի գրառում",
      clientSnapshot: "Հաճախորդների պատկեր",
      noClientsYet: "Հաճախորդներ դեռ չկան",
      noMatchingClients: "Համընկնող հաճախորդներ չկան",
      searchClients: "Որոնել հաճախորդների մեջ...",

      bookings: "Ամրագրումներ",
      createAppointment: "Ստեղծել ամրագրում",
      bookingTime: "Ամրագրման ժամ",
      startTime: "Մեկնարկի ժամ",
      selectClient: "Ընտրել հաճախորդին",
      selectService: "Ընտրել ծառայությունը",
      bookingNotes: "Ամրագրման նշումներ",
      todayBookings: "Այսօրվա ամրագրումներ",
      upcomingBookings: "Առաջիկա ամրագրումներ",
      bookingFilters: "Ամրագրման ֆիլտրեր",
      bookingRegistry: "Ամրագրումների մատյան",
      noAppointmentsYet: "Ամրագրումներ դեռ չկան",
      noMatchingAppointments: "Համընկնող ամրագրումներ չկան",
      searchAppointments: "Որոնել ամրագրումների մեջ...",
      nextHour: "Հաջորդ ժամը",
      resetForm: "Մաքրել ձևը",
      complete: "Ավարտել",
      all: "Բոլորը",

      dashboard: "Գլխավոր վահանակ",
      operationsReady: "Գործողությունները պատրաստ են",
      commandNavigation: "Կառավարման նավիգացիա",
      quickActions: "Արագ գործողություններ",
      executiveSnapshot: "Գլխավոր պատկերը",
      insights: "Վերլուծություններ",
      appointments: "Ամրագրումներ",
      serviceCatalog: "Ծառայությունների կատալոգ",
      totalClients: "Ընդամենը հաճախորդներ",
      totalServices: "Ընդամենը ծառայություններ",
      totalBookings: "Ընդամենը ամրագրումներ",
      scheduledBookings: "Պլանավորված ամրագրումներ",
      completedBookings: "Ավարտված ամրագրումներ",
      cancelledBookings: "Չեղարկված ամրագրումներ",

      workspace: "Աշխատանքային տարածք",
      quickNavigation: "Արագ նավիգացիա",
      openDashboard: "Բացել գլխավոր վահանակը",
      openBookings: "Բացել ամրագրումները",
      openClients: "Բացել հաճախորդներին",
      openServiceCatalog: "Բացել ծառայությունների կատալոգը",
      openInsights: "Բացել վերլուծությունները",
      openPdfReports: "Բացել PDF հաշվետվությունները",
      openApiDocs: "Բացել API Docs-ը",
      checkBackendHealth: "Ստուգել backend-ի առողջությունը",

      pdfReports: "PDF հաշվետվություններ",
      reportsReady: "Հաշվետվությունները պատրաստ են",
      dailyPdfExport: "Օրական PDF արտահանում",
      exportReadiness: "Արտահանման պատրաստվածություն",
      reportingWorkflow: "Հաշվետվության հոսք",
      selectedDate: "Ընտրված ամսաթիվ",
      exportState: "Արտահանման վիճակ",
      generatingPdf: "PDF-ը գեներացվում է...",
      readyToExport: "Պատրաստ է արտահանման",

      catalogReady: "Կատալոգը պատրաստ է",
      createServiceEntry: "Ստեղծել ծառայության գրառում",
      catalogSnapshot: "Կատալոգի պատկերը",
      noServicesYet: "Ծառայություններ դեռ չկան",
      noMatchingServices: "Համընկնող ծառայություններ չկան",
      serviceName: "Ծառայության անվանում",
      durationInMinutes: "Տևողությունը րոպեներով",
      price: "Գին",
      currency: "Արժույթ",
      createService: "Ստեղծել ծառայություն",
      searchServices: "Որոնել ծառայություններ...",

      bookingsTab: "Ամրագրումներ",
      clientsTab: "Հաճախորդներ",
      insightsTab: "Վերլուծություններ",

      requiredFields: "Պարտադիր դաշտերը բացակայում են",
      serviceFieldsRequired:
        "Ծառայության անունը, տևողությունը և գինը պարտադիր են",
      bookingFieldsRequired:
        "Հաճախորդը, ծառայությունը և ամրագրման ժամը պարտադիր են",
      bookingStartRequired:
        "Հաճախորդը, ծառայությունը և մեկնարկի ամսաթիվը պարտադիր են",
      createdSuccessfully: "Հաջողությամբ ստեղծվեց",
      updatedSuccessfully: "Հաջողությամբ թարմացվեց",
      deletedSuccessfully: "Հաջողությամբ ջնջվեց",
      completedSuccessfully: "Հաջողությամբ ավարտվեց",
      cancelledSuccessfully: "Հաջողությամբ չեղարկվեց",
      serviceAddedSuccessfully:
        "Ծառայությունը հաջողությամբ ավելացվեց կատալոգում",
      serviceUpdatedSuccessfully:
        "Ծառայության գրառումը հաջողությամբ թարմացվեց",
      serviceDeletedSuccessfully:
        "Ծառայությունը հաջողությամբ հեռացվեց կատալոգից",
      bookingCreatedSuccessfully: "Ամրագրումը հաջողությամբ ստեղծվեց",
      bookingUpdatedSuccessfully:
        "Ամրագրման տվյալները հաջողությամբ թարմացվեցին",
      bookingCompletedSuccessfully:
        "Ամրագրումը նշվեց որպես ավարտված",
      bookingCancelledSuccessfully: "Ամրագրումը չեղարկվեց",
      bookingDeletedSuccessfully:
        "Ամրագրումը հաջողությամբ ջնջվեց",
      deleteServiceTitle: "Ջնջե՞լ ծառայությունը",
      deleteAppointmentTitle: "Ջնջե՞լ ամրագրումը",
      sessionExpiredSignIn: "Սեսիան ավարտվել է։ Մուտք գործեք կրկին։",
      failedToExportPdf: "Չհաջողվեց արտահանել PDF-ը",
      exportUiWebOnly: "UI-ից PDF արտահանումը այժմ հասանելի է միայն web-ում։",

      bookingFlowConnected: "Ամրագրման հոսքը միացված է",
      createAppointmentSubtitle:
        "Ստեղծեք նոր սրահի ամրագրում հաճախորդով, ծառայությամբ, ամսաթվով և նշումներով։",
      todayBookingsSubtitle: "Այսօրվա ամրագրումների կենդանի հոսք։",
      noBookingsToday: "Այսօր ամրագրումներ չկան",
      noBookingsTodaySubtitle:
        "Այս պահին այսօրվա համար պլանավորված ամրագրումներ չկան։",
      upcomingBookingsSubtitle:
        "Հաջորդ պլանավորված հաճախորդների հոսք։",
      noUpcomingBookings: "Առաջիկա ամրագրումներ չկան",
      noUpcomingBookingsSubtitle:
        "Ապագայի համար դեռ ամրագրումներ չկան։",
      bookingFiltersSubtitle:
        "Ակնթարթորեն փոխարկեք ամրագրման գործառնական վիճակները։",
      bookingRegistrySubtitle:
        "Որոնեք, ֆիլտրեք, թարմացրեք, ավարտեք, չեղարկեք կամ հեռացրեք ամրագրումները մեկ վայրից։",
      noAppointmentsYetSubtitle:
        "Ստեղծեք ձեր առաջին ամրագրումը վերևի ձևի միջոցով։",
      noMatchingAppointmentsSubtitle:
        "Փորձեք այլ որոնման բառ կամ փոխեք ակտիվ ֆիլտրը։",
      selectStatus: "Ընտրել կարգավիճակը",
      deleteServiceMessagePrefix: "Սա մշտապես կհեռացնի ",
      deleteServiceMessageSuffix: " ձեր կատալոգից։",
      deleteBookingMessagePrefix: "Այս ամրագրումը ",
      deleteBookingMessageSuffix: " համար մշտապես կջնջվի։",
      servicesSessionReadySubtitle:
        "Ձեր սեսիան ակտիվ է և կարող է կառավարել գինը, տևողությունը և ծառայության տեսանելիությունը։",
      createServiceEntrySubtitle:
        "Ավելացրեք պրեմիում սրահի ծառայություն ձեր կատալոգում։",
      catalogSnapshotSubtitle:
        "Արագ տեսանելիություն ձեր ընթացիկ ծառայությունների կազմին։",
      serviceCatalogSubtitle:
        "Որոնեք, խմբագրեք, ակտիվացրեք, ապաակտիվացրեք և կառավարեք սրահի ծառայությունները։",
      noServicesYetSubtitle:
        "Ստեղծեք ձեր առաջին սրահի ծառայությունը, որպեսզի սկսեք ընդունել ամրագրումներ։",
      noMatchingServicesSubtitle:
        "Փորձեք այլ որոնման բառ կամ մաքրեք որոնման դաշտը։",
    },
  },

  ru: {
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      search: "Поиск",
      create: "Создать",
      total: "Всего",
      active: "Активные",
      inactive: "Неактивные",
      today: "Сегодня",
      yesterday: "Вчера",
      upcoming: "Предстоящие",
      scheduled: "Запланированные",
      completed: "Завершённые",
      cancelled: "Отменённые",
      working: "Выполняется...",
      creating: "Создание...",

      client: "Клиент",
      clients: "Клиенты",
      fullName: "Полное имя",
      phone: "Телефон",
      email: "E-mail",
      notes: "Заметки",
      createClient: "Создать клиента",
      createClientEntry: "Создать запись клиента",
      clientSnapshot: "Снимок клиентов",
      noClientsYet: "Клиентов пока нет",
      noMatchingClients: "Совпадающих клиентов нет",
      searchClients: "Поиск клиентов...",

      bookings: "Записи",
      createAppointment: "Создать запись",
      bookingTime: "Время записи",
      startTime: "Время начала",
      selectClient: "Выбрать клиента",
      selectService: "Выбрать услугу",
      bookingNotes: "Заметки к записи",
      todayBookings: "Записи на сегодня",
      upcomingBookings: "Предстоящие записи",
      bookingFilters: "Фильтры записей",
      bookingRegistry: "Реестр записей",
      noAppointmentsYet: "Записей пока нет",
      noMatchingAppointments: "Совпадающих записей нет",
      searchAppointments: "Поиск записей...",
      nextHour: "Следующий час",
      resetForm: "Сбросить форму",
      complete: "Завершить",
      all: "Все",

      dashboard: "Дашборд",
      operationsReady: "Операции готовы",
      commandNavigation: "Навигация управления",
      quickActions: "Быстрые действия",
      executiveSnapshot: "Сводная картина",
      insights: "Аналитика",
      appointments: "Записи",
      serviceCatalog: "Каталог услуг",
      totalClients: "Всего клиентов",
      totalServices: "Всего услуг",
      totalBookings: "Всего записей",
      scheduledBookings: "Запланированные записи",
      completedBookings: "Завершённые записи",
      cancelledBookings: "Отменённые записи",

      workspace: "Рабочее пространство",
      quickNavigation: "Быстрая навигация",
      openDashboard: "Открыть дашборд",
      openBookings: "Открыть записи",
      openClients: "Открыть клиентов",
      openServiceCatalog: "Открыть каталог услуг",
      openInsights: "Открыть аналитику",
      openPdfReports: "Открыть PDF отчёты",
      openApiDocs: "Открыть API Docs",
      checkBackendHealth: "Проверить состояние backend",

      pdfReports: "PDF отчёты",
      reportsReady: "Отчёты готовы",
      dailyPdfExport: "Ежедневный PDF экспорт",
      exportReadiness: "Готовность экспорта",
      reportingWorkflow: "Поток отчётности",
      selectedDate: "Выбранная дата",
      exportState: "Состояние экспорта",
      generatingPdf: "Генерация PDF...",
      readyToExport: "Готово к экспорту",

      catalogReady: "Каталог готов",
      createServiceEntry: "Создать запись услуги",
      catalogSnapshot: "Снимок каталога",
      noServicesYet: "Услуг пока нет",
      noMatchingServices: "Совпадающих услуг нет",
      serviceName: "Название услуги",
      durationInMinutes: "Длительность в минутах",
      price: "Цена",
      currency: "Валюта",
      createService: "Создать услугу",
      searchServices: "Поиск услуг...",

      bookingsTab: "Записи",
      clientsTab: "Клиенты",
      insightsTab: "Аналитика",

      requiredFields: "Обязательные поля отсутствуют",
      serviceFieldsRequired:
        "Название услуги, длительность и цена обязательны",
      bookingFieldsRequired:
        "Клиент, услуга и время записи обязательны",
      bookingStartRequired:
        "Клиент, услуга и дата начала обязательны",
      createdSuccessfully: "Успешно создано",
      updatedSuccessfully: "Успешно обновлено",
      deletedSuccessfully: "Успешно удалено",
      completedSuccessfully: "Успешно завершено",
      cancelledSuccessfully: "Успешно отменено",
      serviceAddedSuccessfully:
        "Услуга успешно добавлена в каталог",
      serviceUpdatedSuccessfully:
        "Запись услуги успешно обновлена",
      serviceDeletedSuccessfully:
        "Услуга успешно удалена из каталога",
      bookingCreatedSuccessfully: "Запись успешно создана",
      bookingUpdatedSuccessfully:
        "Данные записи успешно обновлены",
      bookingCompletedSuccessfully:
        "Запись отмечена как завершённая",
      bookingCancelledSuccessfully: "Запись отменена",
      bookingDeletedSuccessfully:
        "Запись успешно удалена",
      deleteServiceTitle: "Удалить услугу?",
      deleteAppointmentTitle: "Удалить запись?",
      sessionExpiredSignIn: "Сессия истекла. Войдите снова.",
      failedToExportPdf: "Не удалось экспортировать PDF",
      exportUiWebOnly: "Экспорт PDF из UI сейчас доступен только для web.",

      bookingFlowConnected: "Поток записей подключён",
      createAppointmentSubtitle:
        "Создайте новую запись салона с клиентом, услугой, датой и заметками.",
      todayBookingsSubtitle:
        "Живой поток записей на текущий день.",
      noBookingsToday: "Сегодня записей нет",
      noBookingsTodaySubtitle:
        "На сегодня сейчас нет запланированных записей.",
      upcomingBookingsSubtitle:
        "Следующий поток запланированных клиентов.",
      noUpcomingBookings: "Нет предстоящих записей",
      noUpcomingBookingsSubtitle:
        "Пока нет будущих записей.",
      bookingFiltersSubtitle:
        "Мгновенно переключайтесь между рабочими статусами записей.",
      bookingRegistrySubtitle:
        "Ищите, фильтруйте, обновляйте, завершайте, отменяйте или удаляйте записи из одного интерфейса.",
      noAppointmentsYetSubtitle:
        "Создайте первую запись с помощью формы выше.",
      noMatchingAppointmentsSubtitle:
        "Попробуйте другой поисковый запрос или смените активный фильтр.",
      selectStatus: "Выбрать статус",
      deleteServiceMessagePrefix: "Это навсегда удалит ",
      deleteServiceMessageSuffix: " из вашего каталога.",
      deleteBookingMessagePrefix: "Эта запись для ",
      deleteBookingMessageSuffix: " будет удалена безвозвратно.",
      servicesSessionReadySubtitle:
        "Ваша сессия активна и готова управлять ценами, длительностью и видимостью услуг.",
      createServiceEntrySubtitle:
        "Добавьте премиальную услугу салона в каталог.",
      catalogSnapshotSubtitle:
        "Быстрая видимость текущего набора услуг.",
      serviceCatalogSubtitle:
        "Ищите, редактируйте, активируйте, деактивируйте и управляйте услугами салона.",
      noServicesYetSubtitle:
        "Создайте первую услугу салона, чтобы начать принимать записи.",
      noMatchingServicesSubtitle:
        "Попробуйте другой поисковый запрос или очистите поле поиска.",
    },
  },

  fr: {
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      search: "Rechercher",
      create: "Créer",
      total: "Total",
      active: "Actifs",
      inactive: "Inactifs",
      today: "Aujourd'hui",
      yesterday: "Hier",
      upcoming: "À venir",
      scheduled: "Planifiés",
      completed: "Terminés",
      cancelled: "Annulés",
      working: "En cours...",
      creating: "Création...",

      client: "Client",
      clients: "Clients",
      fullName: "Nom complet",
      phone: "Téléphone",
      email: "E-mail",
      notes: "Notes",
      createClient: "Créer un client",
      createClientEntry: "Créer une fiche client",
      clientSnapshot: "Aperçu clients",
      noClientsYet: "Aucun client pour le moment",
      noMatchingClients: "Aucun client correspondant",
      searchClients: "Rechercher des clients...",

      bookings: "Réservations",
      createAppointment: "Créer un rendez-vous",
      bookingTime: "Heure du rendez-vous",
      startTime: "Heure de début",
      selectClient: "Sélectionner un client",
      selectService: "Sélectionner un service",
      bookingNotes: "Notes du rendez-vous",
      todayBookings: "Réservations du jour",
      upcomingBookings: "Réservations à venir",
      bookingFilters: "Filtres des réservations",
      bookingRegistry: "Registre des réservations",
      noAppointmentsYet: "Aucun rendez-vous pour le moment",
      noMatchingAppointments: "Aucun rendez-vous correspondant",
      searchAppointments: "Rechercher des rendez-vous...",
      nextHour: "Heure suivante",
      resetForm: "Réinitialiser le formulaire",
      complete: "Terminer",
      all: "Tous",

      dashboard: "Tableau de bord",
      operationsReady: "Opérations prêtes",
      commandNavigation: "Navigation de commande",
      quickActions: "Actions rapides",
      executiveSnapshot: "Vue d’ensemble",
      insights: "Analyses",
      appointments: "Rendez-vous",
      serviceCatalog: "Catalogue de services",
      totalClients: "Nombre total de clients",
      totalServices: "Nombre total de services",
      totalBookings: "Nombre total de réservations",
      scheduledBookings: "Réservations planifiées",
      completedBookings: "Réservations terminées",
      cancelledBookings: "Réservations annulées",

      workspace: "Espace de travail",
      quickNavigation: "Navigation rapide",
      openDashboard: "Ouvrir le tableau de bord",
      openBookings: "Ouvrir les réservations",
      openClients: "Ouvrir les clients",
      openServiceCatalog: "Ouvrir le catalogue des services",
      openInsights: "Ouvrir les analyses",
      openPdfReports: "Ouvrir les rapports PDF",
      openApiDocs: "Ouvrir l’API Docs",
      checkBackendHealth: "Vérifier la santé du backend",

      pdfReports: "Rapports PDF",
      reportsReady: "Rapports prêts",
      dailyPdfExport: "Export PDF quotidien",
      exportReadiness: "État de préparation à l’export",
      reportingWorkflow: "Flux de reporting",
      selectedDate: "Date sélectionnée",
      exportState: "État de l’export",
      generatingPdf: "Génération du PDF...",
      readyToExport: "Prêt à exporter",

      catalogReady: "Catalogue prêt",
      createServiceEntry: "Créer une fiche service",
      catalogSnapshot: "Aperçu du catalogue",
      noServicesYet: "Aucun service pour le moment",
      noMatchingServices: "Aucun service correspondant",
      serviceName: "Nom du service",
      durationInMinutes: "Durée en minutes",
      price: "Prix",
      currency: "Devise",
      createService: "Créer un service",
      searchServices: "Rechercher des services...",

      bookingsTab: "Réservations",
      clientsTab: "Clients",
      insightsTab: "Analyses",

      requiredFields: "Des champs obligatoires sont manquants",
      serviceFieldsRequired:
        "Le nom du service, la durée et le prix sont obligatoires",
      bookingFieldsRequired:
        "Le client, le service et l’heure du rendez-vous sont obligatoires",
      bookingStartRequired:
        "Le client, le service et la date de début sont obligatoires",
      createdSuccessfully: "Création réussie",
      updatedSuccessfully: "Mise à jour réussie",
      deletedSuccessfully: "Suppression réussie",
      completedSuccessfully: "Terminé avec succès",
      cancelledSuccessfully: "Annulé avec succès",
      serviceAddedSuccessfully:
        "Le service a été ajouté au catalogue avec succès",
      serviceUpdatedSuccessfully:
        "L’entrée du catalogue a été mise à jour avec succès",
      serviceDeletedSuccessfully:
        "Le service a été supprimé du catalogue avec succès",
      bookingCreatedSuccessfully:
        "Le rendez-vous a été créé avec succès",
      bookingUpdatedSuccessfully:
        "Les détails du rendez-vous ont été mis à jour avec succès",
      bookingCompletedSuccessfully:
        "Le rendez-vous a été marqué comme terminé",
      bookingCancelledSuccessfully:
        "Le rendez-vous a été annulé",
      bookingDeletedSuccessfully:
        "Le rendez-vous a été supprimé avec succès",
      deleteServiceTitle: "Supprimer le service ?",
      deleteAppointmentTitle: "Supprimer le rendez-vous ?",
      sessionExpiredSignIn: "Session expirée. Connectez-vous d’abord.",
      failedToExportPdf: "Échec de l’export du PDF",
      exportUiWebOnly:
        "L’export PDF depuis l’interface est actuellement disponible uniquement sur le web.",

      bookingFlowConnected: "Flux de rendez-vous connecté",
      createAppointmentSubtitle:
        "Créez un nouveau rendez-vous de salon avec client, service, date et notes.",
      todayBookingsSubtitle:
        "Flux des rendez-vous du jour en direct.",
      noBookingsToday: "Aucun rendez-vous aujourd’hui",
      noBookingsTodaySubtitle:
        "Aucun rendez-vous n’est prévu pour aujourd’hui pour le moment.",
      upcomingBookingsSubtitle:
        "Prochain flux de clients programmés.",
      noUpcomingBookings: "Aucun rendez-vous à venir",
      noUpcomingBookingsSubtitle:
        "Aucun rendez-vous futur n’est encore planifié.",
      bookingFiltersSubtitle:
        "Basculez instantanément entre les états opérationnels des rendez-vous.",
      bookingRegistrySubtitle:
        "Recherchez, filtrez, mettez à jour, terminez, annulez ou supprimez les rendez-vous depuis une seule interface.",
      noAppointmentsYetSubtitle:
        "Créez votre premier rendez-vous avec le formulaire ci-dessus.",
      noMatchingAppointmentsSubtitle:
        "Essayez un autre terme de recherche ou changez le filtre actif.",
      selectStatus: "Sélectionner un statut",
      deleteServiceMessagePrefix: "Cela supprimera définitivement ",
      deleteServiceMessageSuffix: " de votre catalogue.",
      deleteBookingMessagePrefix: "Ce rendez-vous pour ",
      deleteBookingMessageSuffix: " sera supprimé définitivement.",
      servicesSessionReadySubtitle:
        "Votre session est active et peut gérer la tarification, la durée et la visibilité des services.",
      createServiceEntrySubtitle:
        "Ajoutez un service de salon premium à votre catalogue.",
      catalogSnapshotSubtitle:
        "Vue rapide de votre mix de services actuel.",
      serviceCatalogSubtitle:
        "Recherchez, modifiez, activez, désactivez et gérez les services du salon.",
      noServicesYetSubtitle:
        "Créez votre premier service de salon pour commencer à accepter des réservations.",
      noMatchingServicesSubtitle:
        "Essayez un autre terme de recherche ou effacez le champ de recherche.",
    },
  },
};

function getByPath(
  obj: TranslationTree,
  path: string
): string | TranslationTree | undefined {
  return path.split(".").reduce<string | TranslationTree | undefined>((acc, key) => {
    if (!acc || typeof acc === "string") return undefined;
    return acc[key];
  }, obj);
}

export const DEFAULT_LOCALE: AppLocale = "en";

export function t(path: string, locale: AppLocale = DEFAULT_LOCALE): string {
  const current = getByPath(translations[locale], path);
  if (typeof current === "string") return current;

  const fallback = getByPath(translations[DEFAULT_LOCALE], path);
  if (typeof fallback === "string") return fallback;

  return path;
}

