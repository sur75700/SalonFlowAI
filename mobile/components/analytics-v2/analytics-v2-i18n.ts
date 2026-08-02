import type {
  AppLocale,
} from "../../lib/i18n/types";

const EN = {
  "common.unassignedService":
    "Unassigned service",
  "common.new":
    "New",

  "health.excellent":
    "Excellent",
  "health.healthy":
    "Healthy",
  "health.needsAttention":
    "Needs attention",
  "health.highPriority":
    "High priority",
  "health.review":
    "Review",

  "hero.overline":
    "SALONFLOW AI · LIVE",
  "hero.title":
    "Salon Intelligence",
  "hero.subtitle":
    "Live appointment, client and service intelligence for the selected rolling period.",
  "hero.liveWindow":
    "Live data · {period} window",
  "hero.updated":
    "Updated {time} · {details}",
  "hero.excludedCurrency":
    "{count} other-currency records excluded",
  "hero.invalidDate":
    "{count} invalid-date records excluded",
  "hero.appointments":
    "{count} appointments",

  "kpi.completedRevenue":
    "Completed Revenue",
  "kpi.bookings":
    "Bookings",
  "kpi.returningClients":
    "Returning Clients",
  "kpi.averageTicket":
    "Average Ticket",
  "kpi.cancellationRate":
    "Cancellation Rate",
  "kpi.businessGrowth":
    "Business Growth",
  "kpi.vsPreviousDays":
    "vs previous {days} days",
  "kpi.returningOfActive":
    "{returning} returning of {active} active",
  "kpi.completedAppointments":
    "{count} completed appointments",
  "kpi.cancelledAppointments":
    "{count} cancelled appointments",
  "kpi.realRevenueComparison":
    "real completed-revenue comparison",

  "status.completed":
    "Completed",
  "status.scheduled":
    "Scheduled",
  "status.cancelled":
    "Cancelled",
  "status.other":
    "Other",

  "client.retention":
    "Retention",
  "client.retentionHint":
    "{count} returning clients",
  "client.newClients":
    "New Clients",
  "client.newHint":
    "created or first seen during period",
  "client.atRiskClients":
    "At-risk Clients",
  "client.atRiskHint":
    "completed previously, absent now",
  "client.highValueClients":
    "High-value Clients",
  "client.highValueHint":
    "at least twice average ticket",

  "action.recoverTitle":
    "Recover at-risk clients",
  "action.recoverWithCount":
    "{count} previously completed clients have no completed appointment in the selected period.",
  "action.recoverNone":
    "No completed-client reactivation gap is visible in the selected period.",
  "action.potentialRecovery":
    "Potential recovery: {value}",
  "action.reviewClients":
    "Review clients",

  "action.scaleTitle":
    "Scale your strongest service",
  "action.scaleWithService":
    "{service} leads the selected period with {count} non-cancelled bookings.",
  "action.scaleNone":
    "No service has enough selected-period activity for a growth recommendation.",
  "action.growthOpportunity":
    "Growth opportunity: {value}",
  "action.reviewService":
    "Review service",

  "action.cancelTitle":
    "Reduce cancellation friction",
  "action.cancelWithCount":
    "{count} cancelled appointments represent {value} in appointment value.",
  "action.cancelNone":
    "No cancelled appointment value is present in the selected period.",
  "action.protectedValue":
    "Protected value: {value}",
  "action.openPlaybook":
    "Open playbook",

  "signal.noActivity":
    "No appointment activity is available in the selected rolling period.",
  "signal.noActivityAction":
    "Create or import appointment activity before making a performance decision.",
  "signal.cancellationExposure":
    "Cancellation exposure is {rate}% in the selected period.",
  "signal.cancellationAction":
    "Review cancellation timing and affected high-value appointments.",
  "signal.atRisk":
    "{count} previously active clients have no completed appointment in the selected period.",
  "signal.atRiskAction":
    "Review the at-risk client segment and its booking rhythm.",
  "signal.strongestService":
    "{service} is the strongest selected-period service signal.",
  "signal.strongestServiceAction":
    "Review capacity and growth potential for {service}.",
  "signal.stable":
    "Selected-period activity is stable with no dominant risk signal.",
  "signal.stableAction":
    "Continue monitoring revenue, retention and cancellation behavior.",

  "opportunity.reactivateClients":
    "Reactivate clients",
  "opportunity.scaleService":
    "Scale {service}",
  "opportunity.scaleTopService":
    "Scale top service",
  "opportunity.reduceCancellations":
    "Reduce cancellations",
  "opportunity.raiseAverageTicket":
    "Raise average ticket",

  "expected.calculatedOpportunity":
    "Calculated opportunity: {value}",

  "container.preparingTitle":
    "Preparing live analytics",
  "container.preparingSubtitle":
    "Restoring the authenticated SalonFlowAI session.",
  "container.authTitle":
    "Authentication required",
  "container.authSubtitle":
    "Sign in through SalonFlowAI to load real appointment, client and service intelligence.",
  "container.loadingTitle":
    "Loading live intelligence",
  "container.loadingSubtitle":
    "Synchronizing up to 180 days of real salon activity.",
  "container.errorTitle":
    "Live analytics needs attention",
  "container.retry":
    "Retry live analytics",
} as const;

export type AnalyticsV2Key =
  keyof typeof EN;

export type AnalyticsV2Params =
  Record<
    string,
    string | number
  >;

type AnalyticsV2Messages =
  Record<
    AnalyticsV2Key,
    string
  >;

const HY: AnalyticsV2Messages = {
  "common.unassignedService":
    "Չկցված ծառայություն",
  "common.new":
    "Նոր",

  "health.excellent":
    "Գերազանց",
  "health.healthy":
    "Առողջ",
  "health.needsAttention":
    "Պահանջում է ուշադրություն",
  "health.highPriority":
    "Բարձր առաջնահերթություն",
  "health.review":
    "Վերանայել",

  "hero.overline":
    "SALONFLOW AI · ԻՐԱԿԱՆ ՏՎՅԱԼՆԵՐ",
  "hero.title":
    "Սրահի բիզնես ինտելեկտ",
  "hero.subtitle":
    "Այցերի, հաճախորդների և ծառայությունների իրական վերլուծություն՝ ընտրված ժամանակահատվածի համար։",
  "hero.liveWindow":
    "Իրական տվյալներ · {period} ժամանակահատված",
  "hero.updated":
    "Թարմացվել է {time} · {details}",
  "hero.excludedCurrency":
    "Այլ արժույթով {count} գրառում բացառվել է",
  "hero.invalidDate":
    "Սխալ ամսաթվով {count} գրառում բացառվել է",
  "hero.appointments":
    "{count} այց",

  "kpi.completedRevenue":
    "Ավարտված եկամուտ",
  "kpi.bookings":
    "Ամրագրումներ",
  "kpi.returningClients":
    "Վերադարձող հաճախորդներ",
  "kpi.averageTicket":
    "Միջին վճարում",
  "kpi.cancellationRate":
    "Չեղարկման տոկոս",
  "kpi.businessGrowth":
    "Բիզնեսի աճ",
  "kpi.vsPreviousDays":
    "նախորդ {days} օրվա համեմատ",
  "kpi.returningOfActive":
    "{active} ակտիվից {returning}-ը վերադարձող",
  "kpi.completedAppointments":
    "{count} ավարտված այց",
  "kpi.cancelledAppointments":
    "{count} չեղարկված այց",
  "kpi.realRevenueComparison":
    "ավարտված եկամտի իրական համեմատություն",

  "status.completed":
    "Ավարտված",
  "status.scheduled":
    "Պլանավորված",
  "status.cancelled":
    "Չեղարկված",
  "status.other":
    "Այլ",

  "client.retention":
    "Հաճախորդների պահպանում",
  "client.retentionHint":
    "{count} վերադարձող հաճախորդ",
  "client.newClients":
    "Նոր հաճախորդներ",
  "client.newHint":
    "ստեղծվել կամ առաջին անգամ այցելել են ժամանակահատվածում",
  "client.atRiskClients":
    "Ռիսկային հաճախորդներ",
  "client.atRiskHint":
    "նախորդ շրջանում ակտիվ էին, այժմ բացակայում են",
  "client.highValueClients":
    "Բարձրարժեք հաճախորդներ",
  "client.highValueHint":
    "առնվազն երկու միջին վճարման արժեք",

  "action.recoverTitle":
    "Վերադարձնել ռիսկային հաճախորդներին",
  "action.recoverWithCount":
    "Նախորդ շրջանում ավարտված այց ունեցած {count} հաճախորդ ընտրված շրջանում ավարտված այց չունի։",
  "action.recoverNone":
    "Ընտրված շրջանում հաճախորդների վերադարձի ակնհայտ բաց չի հայտնաբերվել։",
  "action.potentialRecovery":
    "Հնարավոր վերադարձ՝ {value}",
  "action.reviewClients":
    "Վերանայել հաճախորդներին",

  "action.scaleTitle":
    "Աճեցնել ամենաուժեղ ծառայությունը",
  "action.scaleWithService":
    "{service} ծառայությունն առաջատար է՝ {count} չչեղարկված ամրագրմամբ։",
  "action.scaleNone":
    "Ընտրված շրջանում ծառայության աճի առաջարկի համար բավարար ակտիվություն չկա։",
  "action.growthOpportunity":
    "Աճի հնարավորություն՝ {value}",
  "action.reviewService":
    "Վերանայել ծառայությունը",

  "action.cancelTitle":
    "Նվազեցնել չեղարկումների ազդեցությունը",
  "action.cancelWithCount":
    "{count} չեղարկված այցը ներկայացնում է {value} հնարավոր արժեք։",
  "action.cancelNone":
    "Ընտրված շրջանում չեղարկված այցերի արժեք չկա։",
  "action.protectedValue":
    "Պաշտպանվող արժեք՝ {value}",
  "action.openPlaybook":
    "Բացել գործողությունների պլանը",

  "signal.noActivity":
    "Ընտրված ժամանակահատվածում այցերի ակտիվություն չկա։",
  "signal.noActivityAction":
    "Կատարողական որոշումից առաջ ստեղծեք կամ ներմուծեք այցերի տվյալներ։",
  "signal.cancellationExposure":
    "Ընտրված շրջանում չեղարկումների ազդեցությունը {rate}% է։",
  "signal.cancellationAction":
    "Վերանայեք չեղարկումների ժամանակը և բարձրարժեք այցերը։",
  "signal.atRisk":
    "Նախկինում ակտիվ {count} հաճախորդ ընտրված շրջանում ավարտված այց չունի։",
  "signal.atRiskAction":
    "Վերանայեք ռիսկային հաճախորդների հատվածը և նրանց ամրագրման հաճախականությունը։",
  "signal.strongestService":
    "{service} ծառայությունն ընտրված շրջանի ամենաուժեղ ազդանշանն է։",
  "signal.strongestServiceAction":
    "Վերանայեք {service} ծառայության հզորությունն ու աճի հնարավորությունը։",
  "signal.stable":
    "Ընտրված շրջանի ակտիվությունը կայուն է՝ առանց գերիշխող ռիսկի։",
  "signal.stableAction":
    "Շարունակեք վերահսկել եկամուտը, պահպանումը և չեղարկումները։",

  "opportunity.reactivateClients":
    "Վերաակտիվացնել հաճախորդներին",
  "opportunity.scaleService":
    "Աճեցնել {service} ծառայությունը",
  "opportunity.scaleTopService":
    "Աճեցնել առաջատար ծառայությունը",
  "opportunity.reduceCancellations":
    "Նվազեցնել չեղարկումները",
  "opportunity.raiseAverageTicket":
    "Բարձրացնել միջին վճարումը",

  "expected.calculatedOpportunity":
    "Հաշվարկված հնարավորություն՝ {value}",

  "container.preparingTitle":
    "Պատրաստվում է իրական վերլուծությունը",
  "container.preparingSubtitle":
    "Վերականգնվում է SalonFlowAI-ի հաստատված աշխատաշրջանը։",
  "container.authTitle":
    "Պահանջվում է մուտք",
  "container.authSubtitle":
    "Մուտք գործեք SalonFlowAI՝ այցերի, հաճախորդների և ծառայությունների իրական վերլուծությունը բեռնելու համար։",
  "container.loadingTitle":
    "Բեռնվում է իրական բիզնես ինտելեկտը",
  "container.loadingSubtitle":
    "Համաժամացվում է սրահի մինչև 180 օրվա իրական ակտիվությունը։",
  "container.errorTitle":
    "Իրական վերլուծությունը պահանջում է ուշադրություն",
  "container.retry":
    "Կրկին բեռնել իրական վերլուծությունը",
};

const RU: AnalyticsV2Messages = {
  "common.unassignedService":
    "Услуга не назначена",
  "common.new":
    "Новое",

  "health.excellent":
    "Отлично",
  "health.healthy":
    "Стабильно",
  "health.needsAttention":
    "Требует внимания",
  "health.highPriority":
    "Высокий приоритет",
  "health.review":
    "Проверить",

  "hero.overline":
    "SALONFLOW AI · РЕАЛЬНЫЕ ДАННЫЕ",
  "hero.title":
    "Бизнес-аналитика салона",
  "hero.subtitle":
    "Аналитика реальных записей, клиентов и услуг за выбранный период.",
  "hero.liveWindow":
    "Реальные данные · период {period}",
  "hero.updated":
    "Обновлено {time} · {details}",
  "hero.excludedCurrency":
    "Исключено записей в другой валюте: {count}",
  "hero.invalidDate":
    "Исключено записей с некорректной датой: {count}",
  "hero.appointments":
    "Записей: {count}",

  "kpi.completedRevenue":
    "Завершённая выручка",
  "kpi.bookings":
    "Записи",
  "kpi.returningClients":
    "Вернувшиеся клиенты",
  "kpi.averageTicket":
    "Средний чек",
  "kpi.cancellationRate":
    "Доля отмен",
  "kpi.businessGrowth":
    "Рост бизнеса",
  "kpi.vsPreviousDays":
    "по сравнению с предыдущими {days} днями",
  "kpi.returningOfActive":
    "Вернувшихся: {returning} из {active} активных",
  "kpi.completedAppointments":
    "Завершённых записей: {count}",
  "kpi.cancelledAppointments":
    "Отменённых записей: {count}",
  "kpi.realRevenueComparison":
    "сравнение реальной завершённой выручки",

  "status.completed":
    "Завершено",
  "status.scheduled":
    "Запланировано",
  "status.cancelled":
    "Отменено",
  "status.other":
    "Другое",

  "client.retention":
    "Удержание",
  "client.retentionHint":
    "Вернувшихся клиентов: {count}",
  "client.newClients":
    "Новые клиенты",
  "client.newHint":
    "созданы или впервые появились в выбранном периоде",
  "client.atRiskClients":
    "Клиенты в зоне риска",
  "client.atRiskHint":
    "были активны ранее, но отсутствуют сейчас",
  "client.highValueClients":
    "Высокоценные клиенты",
  "client.highValueHint":
    "ценность не менее двух средних чеков",

  "action.recoverTitle":
    "Вернуть клиентов из зоны риска",
  "action.recoverWithCount":
    "У {count} ранее активных клиентов нет завершённой записи в выбранном периоде.",
  "action.recoverNone":
    "В выбранном периоде явного разрыва реактивации клиентов не обнаружено.",
  "action.potentialRecovery":
    "Потенциальный возврат: {value}",
  "action.reviewClients":
    "Проверить клиентов",

  "action.scaleTitle":
    "Масштабировать сильнейшую услугу",
  "action.scaleWithService":
    "{service} лидирует с {count} неотменёнными записями.",
  "action.scaleNone":
    "Недостаточно активности для рекомендации по росту услуги.",
  "action.growthOpportunity":
    "Возможность роста: {value}",
  "action.reviewService":
    "Проверить услугу",

  "action.cancelTitle":
    "Снизить влияние отмен",
  "action.cancelWithCount":
    "{count} отменённых записей представляют потенциальную стоимость {value}.",
  "action.cancelNone":
    "В выбранном периоде нет стоимости отменённых записей.",
  "action.protectedValue":
    "Защищаемая стоимость: {value}",
  "action.openPlaybook":
    "Открыть план действий",

  "signal.noActivity":
    "В выбранном периоде отсутствует активность записей.",
  "signal.noActivityAction":
    "Создайте или импортируйте записи до принятия решения об эффективности.",
  "signal.cancellationExposure":
    "Доля отмен в выбранном периоде составляет {rate}%.",
  "signal.cancellationAction":
    "Проверьте время отмен и затронутые высокоценные записи.",
  "signal.atRisk":
    "У {count} ранее активных клиентов нет завершённой записи в выбранном периоде.",
  "signal.atRiskAction":
    "Проверьте сегмент клиентов в зоне риска и ритм их записей.",
  "signal.strongestService":
    "{service} — самый сильный сигнал выбранного периода.",
  "signal.strongestServiceAction":
    "Проверьте доступную мощность и потенциал роста услуги {service}.",
  "signal.stable":
    "Активность выбранного периода стабильна, доминирующий риск отсутствует.",
  "signal.stableAction":
    "Продолжайте контролировать выручку, удержание и отмены.",

  "opportunity.reactivateClients":
    "Реактивировать клиентов",
  "opportunity.scaleService":
    "Масштабировать {service}",
  "opportunity.scaleTopService":
    "Масштабировать ведущую услугу",
  "opportunity.reduceCancellations":
    "Снизить отмены",
  "opportunity.raiseAverageTicket":
    "Увеличить средний чек",

  "expected.calculatedOpportunity":
    "Расчётная возможность: {value}",

  "container.preparingTitle":
    "Подготовка реальной аналитики",
  "container.preparingSubtitle":
    "Восстанавливается авторизованная сессия SalonFlowAI.",
  "container.authTitle":
    "Требуется авторизация",
  "container.authSubtitle":
    "Войдите в SalonFlowAI для загрузки реальной аналитики записей, клиентов и услуг.",
  "container.loadingTitle":
    "Загрузка бизнес-аналитики",
  "container.loadingSubtitle":
    "Синхронизируется до 180 дней реальной активности салона.",
  "container.errorTitle":
    "Реальная аналитика требует внимания",
  "container.retry":
    "Повторить загрузку аналитики",
};

const FR: AnalyticsV2Messages = {
  "common.unassignedService":
    "Service non attribué",
  "common.new":
    "Nouveau",

  "health.excellent":
    "Excellent",
  "health.healthy":
    "Sain",
  "health.needsAttention":
    "Nécessite une attention",
  "health.highPriority":
    "Priorité élevée",
  "health.review":
    "À vérifier",

  "hero.overline":
    "SALONFLOW AI · DONNÉES RÉELLES",
  "hero.title":
    "Intelligence du salon",
  "hero.subtitle":
    "Analyse réelle des rendez-vous, clients et services sur la période sélectionnée.",
  "hero.liveWindow":
    "Données réelles · période {period}",
  "hero.updated":
    "Mis à jour à {time} · {details}",
  "hero.excludedCurrency":
    "{count} enregistrements dans une autre devise exclus",
  "hero.invalidDate":
    "{count} enregistrements avec une date invalide exclus",
  "hero.appointments":
    "{count} rendez-vous",

  "kpi.completedRevenue":
    "Revenu réalisé",
  "kpi.bookings":
    "Réservations",
  "kpi.returningClients":
    "Clients récurrents",
  "kpi.averageTicket":
    "Panier moyen",
  "kpi.cancellationRate":
    "Taux d’annulation",
  "kpi.businessGrowth":
    "Croissance de l’activité",
  "kpi.vsPreviousDays":
    "par rapport aux {days} jours précédents",
  "kpi.returningOfActive":
    "{returning} clients récurrents sur {active} actifs",
  "kpi.completedAppointments":
    "{count} rendez-vous terminés",
  "kpi.cancelledAppointments":
    "{count} rendez-vous annulés",
  "kpi.realRevenueComparison":
    "comparaison réelle du revenu réalisé",

  "status.completed":
    "Terminé",
  "status.scheduled":
    "Planifié",
  "status.cancelled":
    "Annulé",
  "status.other":
    "Autre",

  "client.retention":
    "Fidélisation",
  "client.retentionHint":
    "{count} clients récurrents",
  "client.newClients":
    "Nouveaux clients",
  "client.newHint":
    "créés ou vus pour la première fois pendant la période",
  "client.atRiskClients":
    "Clients à risque",
  "client.atRiskHint":
    "actifs auparavant, absents maintenant",
  "client.highValueClients":
    "Clients à forte valeur",
  "client.highValueHint":
    "valeur au moins égale à deux paniers moyens",

  "action.recoverTitle":
    "Récupérer les clients à risque",
  "action.recoverWithCount":
    "{count} clients auparavant actifs n’ont aucun rendez-vous terminé pendant la période sélectionnée.",
  "action.recoverNone":
    "Aucun écart clair de réactivation client n’est visible pendant la période sélectionnée.",
  "action.potentialRecovery":
    "Récupération potentielle : {value}",
  "action.reviewClients":
    "Examiner les clients",

  "action.scaleTitle":
    "Développer le service le plus performant",
  "action.scaleWithService":
    "{service} est en tête avec {count} réservations non annulées.",
  "action.scaleNone":
    "L’activité est insuffisante pour recommander la croissance d’un service.",
  "action.growthOpportunity":
    "Opportunité de croissance : {value}",
  "action.reviewService":
    "Examiner le service",

  "action.cancelTitle":
    "Réduire l’impact des annulations",
  "action.cancelWithCount":
    "{count} rendez-vous annulés représentent une valeur potentielle de {value}.",
  "action.cancelNone":
    "Aucune valeur de rendez-vous annulé n’est présente pendant la période sélectionnée.",
  "action.protectedValue":
    "Valeur protégée : {value}",
  "action.openPlaybook":
    "Ouvrir le plan d’action",

  "signal.noActivity":
    "Aucune activité de rendez-vous n’est disponible pendant la période sélectionnée.",
  "signal.noActivityAction":
    "Créez ou importez des rendez-vous avant de prendre une décision de performance.",
  "signal.cancellationExposure":
    "L’exposition aux annulations est de {rate}% pendant la période sélectionnée.",
  "signal.cancellationAction":
    "Examinez le moment des annulations et les rendez-vous à forte valeur concernés.",
  "signal.atRisk":
    "{count} clients auparavant actifs n’ont aucun rendez-vous terminé pendant la période sélectionnée.",
  "signal.atRiskAction":
    "Examinez le segment des clients à risque et leur rythme de réservation.",
  "signal.strongestService":
    "{service} est le signal de service le plus fort de la période sélectionnée.",
  "signal.strongestServiceAction":
    "Examinez la capacité et le potentiel de croissance de {service}.",
  "signal.stable":
    "L’activité de la période sélectionnée est stable, sans risque dominant.",
  "signal.stableAction":
    "Continuez à surveiller le revenu, la fidélisation et les annulations.",

  "opportunity.reactivateClients":
    "Réactiver les clients",
  "opportunity.scaleService":
    "Développer {service}",
  "opportunity.scaleTopService":
    "Développer le meilleur service",
  "opportunity.reduceCancellations":
    "Réduire les annulations",
  "opportunity.raiseAverageTicket":
    "Augmenter le panier moyen",

  "expected.calculatedOpportunity":
    "Opportunité calculée : {value}",

  "container.preparingTitle":
    "Préparation de l’analyse réelle",
  "container.preparingSubtitle":
    "Restauration de la session SalonFlowAI authentifiée.",
  "container.authTitle":
    "Authentification requise",
  "container.authSubtitle":
    "Connectez-vous à SalonFlowAI pour charger l’analyse réelle des rendez-vous, clients et services.",
  "container.loadingTitle":
    "Chargement de l’intelligence métier",
  "container.loadingSubtitle":
    "Synchronisation de 180 jours maximum d’activité réelle du salon.",
  "container.errorTitle":
    "L’analyse réelle nécessite une attention",
  "container.retry":
    "Réessayer le chargement",
};

const MESSAGES: Record<
  AppLocale,
  AnalyticsV2Messages
> = {
  en: EN,
  hy: HY,
  ru: RU,
  fr: FR,
};

export function analyticsV2T(
  locale: AppLocale,
  key: AnalyticsV2Key,
  params: AnalyticsV2Params = {}
): string {
  const template =
    MESSAGES[locale]?.[key] ??
    EN[key];

  return Object.entries(params).reduce(
    (result, [name, value]) =>
      result
        .split(`{${name}}`)
        .join(String(value)),
    template
  );
}

// ANALYTICS_V2_UI_I18N_PHASE_1

const ANALYTICS_V2_UI_EN = {
  "tab.overview": "Overview",
  "tab.revenue": "Revenue",
  "tab.clients": "Clients",
  "tab.services": "Services",
  "tab.operations": "Operations",
  "tab.aiActions": "AI Actions",
  "period.7d": "7D",
  "period.30d": "30D",
  "period.90d": "90D",
  "shell.explainableIntelligence": "Explainable intelligence",
  "shell.updatedJustNow": "Updated just now",
  "shell.refreshLiveA11y": "Refresh live analytics",
  "shell.refreshPreviewA11y": "Refresh analytics preview",
  "shell.refreshingLive": "Refreshing live data…",
  "shell.refreshingPreview": "Refreshing preview…",
  "shell.refresh": "Refresh",
  "shell.exportA11y": "Open analytics export center",
  "shell.export": "Export",
  "shell.previewFooter": "Analytics V2 design candidate · Presentation only · Real data and full localization are intentionally deferred.",
} as const;

export type AnalyticsV2UiKey =
  keyof typeof ANALYTICS_V2_UI_EN;

type AnalyticsV2UiLocale =
  | "en"
  | "hy"
  | "ru"
  | "fr";

const ANALYTICS_V2_UI_HY: Record<AnalyticsV2UiKey, string> = {
  "tab.overview": "Ընդհանուր պատկեր",
  "tab.revenue": "Եկամուտ",
  "tab.clients": "Հաճախորդներ",
  "tab.services": "Ծառայություններ",
  "tab.operations": "Գործառնություններ",
  "tab.aiActions": "AI գործողություններ",
  "period.7d": "7 օր",
  "period.30d": "30 օր",
  "period.90d": "90 օր",
  "shell.explainableIntelligence": "Բացատրելի վերլուծություն",
  "shell.updatedJustNow": "Թարմացվել է հենց նոր",
  "shell.refreshLiveA11y": "Թարմացնել իրական ժամանակի վերլուծությունը",
  "shell.refreshPreviewA11y": "Թարմացնել վերլուծության նախադիտումը",
  "shell.refreshingLive": "Իրական ժամանակի տվյալները թարմացվում են…",
  "shell.refreshingPreview": "Նախադիտումը թարմացվում է…",
  "shell.refresh": "Թարմացնել",
  "shell.exportA11y": "Բացել վերլուծության արտահանման կենտրոնը",
  "shell.export": "Արտահանել",
  "shell.previewFooter": "Analytics V2-ի դիզայնի տարբերակ · Միայն ներկայացման համար · Իրական տվյալներն ու ամբողջական տեղայնացումը միտումնավոր հետաձգված են։",
};

const ANALYTICS_V2_UI_RU: Record<AnalyticsV2UiKey, string> = {
  "tab.overview": "Обзор",
  "tab.revenue": "Выручка",
  "tab.clients": "Клиенты",
  "tab.services": "Услуги",
  "tab.operations": "Операции",
  "tab.aiActions": "Действия ИИ",
  "period.7d": "7 дн.",
  "period.30d": "30 дн.",
  "period.90d": "90 дн.",
  "shell.explainableIntelligence": "Объяснимая аналитика",
  "shell.updatedJustNow": "Обновлено только что",
  "shell.refreshLiveA11y": "Обновить аналитику в реальном времени",
  "shell.refreshPreviewA11y": "Обновить предварительный просмотр аналитики",
  "shell.refreshingLive": "Обновление данных в реальном времени…",
  "shell.refreshingPreview": "Обновление предварительного просмотра…",
  "shell.refresh": "Обновить",
  "shell.exportA11y": "Открыть центр экспорта аналитики",
  "shell.export": "Экспортировать",
  "shell.previewFooter": "Вариант дизайна Analytics V2 · Только для презентации · Реальные данные и полная локализация намеренно отложены.",
};

const ANALYTICS_V2_UI_FR: Record<AnalyticsV2UiKey, string> = {
  "tab.overview": "Vue d’ensemble",
  "tab.revenue": "Revenus",
  "tab.clients": "Clients",
  "tab.services": "Services",
  "tab.operations": "Opérations",
  "tab.aiActions": "Actions IA",
  "period.7d": "7 j",
  "period.30d": "30 j",
  "period.90d": "90 j",
  "shell.explainableIntelligence": "Analytique explicable",
  "shell.updatedJustNow": "Mis à jour à l’instant",
  "shell.refreshLiveA11y": "Actualiser l’analytique en direct",
  "shell.refreshPreviewA11y": "Actualiser l’aperçu analytique",
  "shell.refreshingLive": "Actualisation des données en direct…",
  "shell.refreshingPreview": "Actualisation de l’aperçu…",
  "shell.refresh": "Actualiser",
  "shell.exportA11y": "Ouvrir le centre d’export analytique",
  "shell.export": "Exporter",
  "shell.previewFooter": "Proposition de design Analytics V2 · Présentation uniquement · Les données réelles et la localisation complète sont volontairement différées.",
};

const ANALYTICS_V2_UI_CATALOG: Record<
  AnalyticsV2UiLocale,
  Record<AnalyticsV2UiKey, string>
> = {
  en: ANALYTICS_V2_UI_EN,
  hy: ANALYTICS_V2_UI_HY,
  ru: ANALYTICS_V2_UI_RU,
  fr: ANALYTICS_V2_UI_FR,
};

function normalizeAnalyticsV2UiLocale(
  locale: string | null | undefined
): AnalyticsV2UiLocale {
  const normalized = (locale ?? "en").toLowerCase();

  if (normalized.startsWith("hy")) return "hy";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("fr")) return "fr";

  return "en";
}

export function analyticsV2UiT(
  locale: string | null | undefined,
  key: AnalyticsV2UiKey
): string {
  const normalized =
    normalizeAnalyticsV2UiLocale(locale);

  return ANALYTICS_V2_UI_CATALOG[normalized][key];
}

// ANALYTICS_V2_SURFACE_I18N_PHASE_2

const ANALYTICS_V2_SURFACE_ROWS = [
  ["Executive Overview", "Գործադիր ամփոփում", "Исполнительный обзор", "Vue exécutive"],
  ["KPIs and business-health summary", "Հիմնական ցուցանիշների և բիզնեսի առողջության ամփոփում", "Сводка KPI и состояния бизнеса", "Synthèse des KPI et de la santé de l’activité"],
  ["Revenue Intelligence", "Եկամտի ինտելեկտ", "Аналитика выручки", "Intelligence des revenus"],
  ["Trend and period comparison", "Միտումների և ժամանակահատվածների համեմատություն", "Сравнение трендов и периодов", "Comparaison des tendances et des périodes"],
  ["Client Intelligence", "Հաճախորդների ինտելեկտ", "Аналитика клиентов", "Intelligence client"],
  ["Retention and risk signals", "Պահպանման և ռիսկի ազդանշաններ", "Сигналы удержания и риска", "Signaux de fidélisation et de risque"],
  ["Service Intelligence", "Ծառայությունների ինտելեկտ", "Аналитика услуг", "Intelligence des services"],
  ["Demand and revenue rankings", "Պահանջարկի և եկամտի դասակարգում", "Рейтинг спроса и выручки", "Classement de la demande et des revenus"],
  ["Operations", "Գործառնություններ", "Операции", "Opérations"],
  ["Booking-status composition", "Ամրագրումների կարգավիճակների կառուցվածք", "Структура статусов записей", "Répartition des statuts de réservation"],
  ["AI Actions", "AI գործողություններ", "Действия ИИ", "Actions IA"],
  ["Recommendations and opportunities", "Առաջարկություններ և հնարավորություններ", "Рекомендации и возможности", "Recommandations et opportunités"],
  ["Section", "Բաժին", "Раздел", "Section"],
  ["Metric", "Ցուցիչ", "Показатель", "Indicateur"],
  ["Value", "Արժեք", "Значение", "Valeur"],
  ["Context", "Համատեքստ", "Контекст", "Contexte"],
  ["Overview", "Ընդհանուր պատկեր", "Обзор", "Vue d’ensemble"],
  ["Salon Health Index", "Սրահի առողջության ինդեքս", "Индекс здоровья салона", "Indice de santé du salon"],
  ["Revenue", "Եկամուտ", "Выручка", "Revenus"],
  ["Clients", "Հաճախորդներ", "Клиенты", "Clients"],
  ["Services", "Ծառայություններ", "Услуги", "Services"],
  ["Booking status", "Ամրագրման կարգավիճակ", "Статус записи", "Statut de réservation"],
  ["Previous: {value}", "Նախորդ՝ {value}", "Предыдущее: {value}", "Précédent : {value}"],
  ["{count} bookings · {share}% demand", "{count} ամրագրում · {share}% պահանջարկ", "{count} записей · {share}% спроса", "{count} réservations · {share}% de demande"],
  ["{priority} · {confidence}% confidence", "{priority} · {confidence}% վստահություն", "{priority} · уверенность {confidence}%", "{priority} · confiance {confidence}%"],
  ["SalonFlowAI Analytics Preview", "SalonFlowAI վերլուծության նախադիտում", "Предпросмотр аналитики SalonFlowAI", "Aperçu analytique SalonFlowAI"],
  ["Salon Intelligence", "Սրահի բիզնես ինտելեկտ", "Бизнес-аналитика салона", "Intelligence du salon"],
  ["live export · selected real data", "իրական արտահանում · ընտրված իրական տվյալներ", "экспорт реальных данных · выбранные реальные данные", "export réel · données réelles sélectionnées"],
  ["preview export · presentation-only data", "նախադիտման արտահանում · միայն ներկայացման տվյալներ", "экспорт предпросмотра · данные только для презентации", "export d’aperçu · données de présentation uniquement"],
  ["Service", "Ծառայություն", "Услуга", "Service"],
  ["Bookings", "Ամրագրումներ", "Записи", "Réservations"],
  ["Demand", "Պահանջարկ", "Спрос", "Demande"],
  ["AI Recommended Actions", "AI-ի առաջարկվող գործողություններ", "Рекомендуемые действия ИИ", "Actions recommandées par l’IA"],
  ["Live selected-period export", "Ընտրված շրջանի իրական տվյալների արտահանում", "Экспорт реальных данных выбранного периода", "Export réel de la période sélectionnée"],
  ["Preview-only export", "Միայն նախադիտման արտահանում", "Экспорт только для предпросмотра", "Export d’aperçu uniquement"],
  ["Generated locally", "Ստեղծվել է տեղային միջավայրում", "Создано локально", "Généré localement"],
  ["Preparing export package…", "Արտահանման փաթեթը պատրաստվում է…", "Подготовка пакета экспорта…", "Préparation du paquet d’export…"],
  ["CSV export downloaded successfully.", "CSV արտահանումը հաջողությամբ ներբեռնվել է։", "CSV-файл успешно загружен.", "L’export CSV a été téléchargé avec succès."],
  ["Print-ready report downloaded successfully.", "Տպագրության պատրաստ հաշվետվությունը հաջողությամբ ներբեռնվել է։", "Готовый к печати отчёт успешно загружен.", "Le rapport prêt à imprimer a été téléchargé avec succès."],
  ["Preview export is currently downloadable on web.", "Նախադիտման արտահանումը ներկայում հասանելի է վեբ տարբերակում։", "Экспорт предпросмотра сейчас доступен в веб-версии.", "L’export d’aperçu est actuellement disponible sur le Web."],
  ["ANALYTICS EXPORT CENTER", "ՎԵՐԼՈՒԾՈՒԹՅԱՆ ԱՐՏԱՀԱՆՄԱՆ ԿԵՆՏՐՈՆ", "ЦЕНТР ЭКСПОРТА АНАЛИТИКИ", "CENTRE D’EXPORT ANALYTIQUE"],
  ["Prepare intelligence export", "Պատրաստել վերլուծական արտահանում", "Подготовить экспорт аналитики", "Préparer l’export analytique"],
  ["Select a format and the sections to include.", "Ընտրեք ձևաչափը և ներառվող բաժինները։", "Выберите формат и разделы для включения.", "Sélectionnez un format et les sections à inclure."],
  ["Close export center", "Փակել արտահանման կենտրոնը", "Закрыть центр экспорта", "Fermer le centre d’export"],
  ["SELECTED PERIOD", "ԸՆՏՐՎԱԾ ԺԱՄԱՆԱԿԱՀԱՏՎԱԾ", "ВЫБРАННЫЙ ПЕРИОД", "PÉRIODE SÉLECTIONNÉE"],
  ["LIVE DATA", "ԻՐԱԿԱՆ ՏՎՅԱԼՆԵՐ", "РЕАЛЬНЫЕ ДАННЫЕ", "DONNÉES RÉELLES"],
  ["PREVIEW DATA", "ՆԱԽԱԴԻՏՄԱՆ ՏՎՅԱԼՆԵՐ", "ДАННЫЕ ПРЕДПРОСМОТРА", "DONNÉES D’APERÇU"],
  ["Export format", "Արտահանման ձևաչափ", "Формат экспорта", "Format d’export"],
  ["Print-ready report", "Տպագրության պատրաստ հաշվետվություն", "Отчёт, готовый к печати", "Rapport prêt à imprimer"],
  ["Download HTML and print or save as PDF.", "Ներբեռնեք HTML-ը և տպեք կամ պահեք որպես PDF։", "Загрузите HTML и распечатайте или сохраните как PDF.", "Téléchargez le HTML, puis imprimez-le ou enregistrez-le en PDF."],
  ["CSV data", "CSV տվյալներ", "Данные CSV", "Données CSV"],
  ["Download structured preview metrics.", "Ներբեռնեք կառուցվածքային նախադիտման ցուցանիշները։", "Загрузите структурированные показатели предпросмотра.", "Téléchargez les indicateurs structurés de l’aperçu."],
  ["Included sections", "Ներառված բաժիններ", "Включённые разделы", "Sections incluses"],
  ["{count} sections selected", "Ընտրված է {count} բաժին", "Выбрано разделов: {count}", "{count} sections sélectionnées"],
  ["Preparing…", "Պատրաստվում է…", "Подготовка…", "Préparation…"],
  ["Prepare export", "Պատրաստել արտահանումը", "Подготовить экспорт", "Préparer l’export"],
  ["Close intelligence details", "Փակել ինտելեկտի մանրամասները", "Закрыть подробности аналитики", "Fermer les détails de l’intelligence"],
  ["Close", "Փակել", "Закрыть", "Fermer"],
  ["Intelligence Breakdown", "Ինտելեկտի բաղադրիչներ", "Структура аналитики", "Décomposition de l’intelligence"],
  ["Explainable components behind this preview signal.", "Այս նախադիտման ազդանշանի բացատրելի բաղադրիչները։", "Объяснимые компоненты этого сигнала предпросмотра.", "Composants explicables à l’origine de ce signal d’aperçu."],
  ["Supporting Evidence", "Հիմնավորող ապացույցներ", "Подтверждающие данные", "Éléments justificatifs"],
  ["The strongest signals supporting the recommendation.", "Առաջարկությունը հիմնավորող ամենաուժեղ ազդանշանները։", "Наиболее сильные сигналы, подтверждающие рекомендацию.", "Les signaux les plus forts à l’appui de la recommandation."],
  ["Recommended Decision Path", "Առաջարկվող որոշման ուղի", "Рекомендуемый путь решения", "Parcours décisionnel recommandé"],
  ["A clear sequence from evidence to measurable action.", "Հստակ հաջորդականություն՝ ապացույցից մինչև չափելի գործողություն։", "Чёткая последовательность от данных к измеримому действию.", "Une séquence claire des preuves à l’action mesurable."],
  ["Presentation-only intelligence", "Ինտելեկտ՝ միայն ներկայացման համար", "Аналитика только для презентации", "Intelligence de présentation uniquement"],
  ["Close intelligence view", "Փակել ինտելեկտի պատուհանը", "Закрыть окно аналитики", "Fermer la vue d’intelligence"],
  ["AI EXECUTIVE INTELLIGENCE", "AI ԳՈՐԾԱԴԻՐ ԻՆՏԵԼԵԿՏ", "ИСПОЛНИТЕЛЬНАЯ АНАЛИТИКА ИИ", "INTELLIGENCE EXÉCUTIVE IA"],
  ["Business Health Deep Dive", "Բիզնեսի առողջության խորքային վերլուծություն", "Углублённый анализ состояния бизнеса", "Analyse approfondie de la santé de l’activité"],
  ["An explainable view of the signals composing the Salon Health Index.", "Սրահի առողջության ինդեքսը կազմող ազդանշանների բացատրելի տեսք։", "Объяснимое представление сигналов, формирующих индекс здоровья салона.", "Vue explicable des signaux composant l’indice de santé du salon."],
  ["Healthy performance with one high-value near-term opportunity.", "Առողջ կատարողականություն՝ մեկ բարձրարժեք մոտակա հնարավորությամբ։", "Стабильные показатели с одной ценной ближайшей возможностью.", "Performance saine avec une opportunité proche à forte valeur."],
  ["Period momentum", "Ժամանակահատվածի դինամիկա", "Динамика периода", "Dynamique de la période"],
  ["Combined preview performance", "Նախադիտման համակցված կատարողականություն", "Совокупная эффективность предпросмотра", "Performance combinée de l’aperçu"],
  ["Strongest signal", "Ամենաուժեղ ազդանշան", "Самый сильный сигнал", "Signal le plus fort"],
  ["Positive completed-revenue trend", "Ավարտված եկամտի դրական միտում", "Положительный тренд завершённой выручки", "Tendance positive du revenu réalisé"],
  ["Primary risk", "Հիմնական ռիսկ", "Основной риск", "Risque principal"],
  ["Retention", "Հաճախորդների պահպանում", "Удержание", "Fidélisation"],
  ["At-risk clients require attention", "Ռիսկային հաճախորդները պահանջում են ուշադրություն", "Клиенты в зоне риска требуют внимания", "Les clients à risque nécessitent une attention"],
  ["Decision confidence", "Որոշման վստահություն", "Уверенность в решении", "Confiance décisionnelle"],
  ["Preview evidence quality", "Նախադիտման ապացույցների որակ", "Качество данных предпросмотра", "Qualité des éléments de l’aperçu"],
  ["Revenue health", "Եկամտի առողջություն", "Состояние выручки", "Santé des revenus"],
  ["Completed revenue and period momentum", "Ավարտված եկամուտ և ժամանակահատվածի դինամիկա", "Завершённая выручка и динамика периода", "Revenu réalisé et dynamique de la période"],
  ["Client retention", "Հաճախորդների պահպանում", "Удержание клиентов", "Fidélisation client"],
  ["Returning and at-risk client signals", "Վերադարձող և ռիսկային հաճախորդների ազդանշաններ", "Сигналы вернувшихся клиентов и клиентов в зоне риска", "Signaux des clients récurrents et à risque"],
  ["Service demand", "Ծառայությունների պահանջարկ", "Спрос на услуги", "Demande de services"],
  ["Bookings and service contribution", "Ամրագրումներ և ծառայությունների ներդրում", "Записи и вклад услуг", "Réservations et contribution des services"],
  ["Operational health", "Գործառնական առողջություն", "Операционное состояние", "Santé opérationnelle"],
  ["Completion and cancellation behavior", "Ավարտումների և չեղարկումների վարքագիծ", "Поведение завершений и отмен", "Comportement des finalisations et annulations"],
  ["Risk control", "Ռիսկերի վերահսկում", "Контроль рисков", "Maîtrise des risques"],
  ["Avoidable-loss exposure", "Կանխարգելելի կորստի ազդեցություն", "Подверженность предотвратимым потерям", "Exposition aux pertes évitables"],
  ["Revenue momentum", "Եկամտի դինամիկա", "Динамика выручки", "Dynamique des revenus"],
  ["The current preview period consistently remains above the comparison period.", "Նախադիտման ընթացիկ ժամանակահատվածը կայունորեն գերազանցում է համեմատական շրջանը։", "Текущий период предпросмотра стабильно превышает сравнительный период.", "La période d’aperçu actuelle reste constamment au-dessus de la période de comparaison."],
  ["Client opportunity", "Հաճախորդների հնարավորություն", "Возможность по клиентам", "Opportunité client"],
  ["A small at-risk segment contains meaningful potential value.", "Ռիսկային փոքր հատվածը պարունակում է նշանակալի հնարավոր արժեք։", "Небольшой сегмент риска содержит значимую потенциальную ценность.", "Un petit segment à risque recèle une valeur potentielle significative."],
  ["8 clients", "8 հաճախորդ", "8 клиентов", "8 clients"],
  ["Service concentration", "Ծառայությունների կենտրոնացում", "Концентрация услуг", "Concentration des services"],
  ["One leading service contributes disproportionate demand and revenue.", "Մեկ առաջատար ծառայություն ձևավորում է անհամաչափ մեծ պահանջարկ և եկամուտ։", "Одна ведущая услуга формирует непропорционально большую долю спроса и выручки.", "Un service leader contribue de manière disproportionnée à la demande et aux revenus."],
  ["92% relative", "92% հարաբերական", "92% относительно", "92 % relatif"],
  ["Observe", "Դիտարկել", "Наблюдать", "Observer"],
  ["Confirm which signal changed most during the selected period.", "Հաստատեք, թե ընտրված շրջանում որ ազդանշանն է առավել փոխվել։", "Определите, какой сигнал изменился сильнее всего за выбранный период.", "Confirmez le signal qui a le plus évolué pendant la période sélectionnée."],
  ["Diagnose", "Ախտորոշել", "Диагностировать", "Diagnostiquer"],
  ["Review the supporting client, service and operational evidence.", "Վերանայեք հաճախորդների, ծառայությունների և գործառնությունների հիմնավորող տվյալները։", "Изучите подтверждающие данные по клиентам, услугам и операциям.", "Examinez les éléments clients, services et opérationnels à l’appui."],
  ["Prioritize", "Առաջնահերթություն սահմանել", "Расставить приоритеты", "Prioriser"],
  ["Select the highest-impact action with acceptable effort.", "Ընտրեք ամենամեծ ազդեցությամբ գործողությունը՝ ընդունելի ջանքով։", "Выберите действие с максимальным эффектом и приемлемыми усилиями.", "Sélectionnez l’action au plus fort impact avec un effort acceptable."],
  ["Measure", "Չափել", "Измерить", "Mesurer"],
  ["Compare the expected impact with the next completed period.", "Համեմատեք սպասվող ազդեցությունը հաջորդ ավարտված ժամանակահատվածի հետ։", "Сравните ожидаемый эффект со следующим завершённым периодом.", "Comparez l’impact attendu avec la prochaine période terminée."],
  ["STRONGEST PREVIEW OPPORTUNITY", "ՆԱԽԱԴԻՏՄԱՆ ԱՄԵՆԱՈՒԺԵՂ ՀՆԱՐԱՎՈՐՈՒԹՅՈՒՆ", "САМАЯ СИЛЬНАЯ ВОЗМОЖНОСТЬ ПРЕДПРОСМОТРА", "MEILLEURE OPPORTUNITÉ DE L’APERÇU"],
  ["AMD 648K potential recovery", "AMD 648K հնարավոր վերադարձ", "Потенциальное восстановление AMD 648K", "Récupération potentielle de AMD 648K"],
  ["The engineering phase will replace every preview score with centralized, explainable real-data calculations.", "Ինժեներական փուլում նախադիտման յուրաքանչյուր գնահատական կփոխարինվի կենտրոնացված և բացատրելի իրական տվյալների հաշվարկով։", "На инженерном этапе каждый показатель предпросмотра будет заменён централизованным объяснимым расчётом по реальным данным.", "La phase d’ingénierie remplacera chaque score d’aperçu par des calculs centralisés et explicables sur des données réelles."],
  ["CLIENT REACTIVATION COMMAND", "ՀԱՃԱԽՈՐԴՆԵՐԻ ՎԵՐԱԱԿՏԻՎԱՑՄԱՆ ԿԵՆՏՐՈՆ", "ЦЕНТР РЕАКТИВАЦИИ КЛИЕНТОВ", "CENTRE DE RÉACTIVATION CLIENT"],
  ["Recover At-risk Clients", "Վերադարձնել ռիսկային հաճախորդներին", "Вернуть клиентов из зоны риска", "Récupérer les clients à risque"],
  ["A focused decision surface for understanding booking rhythm, urgency and potential recovery.", "Կենտրոնացված որոշման միջավայր՝ ամրագրումների ռիթմը, հրատապությունը և հնարավոր վերադարձը հասկանալու համար։", "Сфокусированная среда решений для анализа ритма записей, срочности и потенциала возврата.", "Une surface décisionnelle ciblée pour comprendre le rythme de réservation, l’urgence et la récupération potentielle."],
  ["At-risk clients", "Ռիսկային հաճախորդներ", "Клиенты в зоне риска", "Clients à risque"],
  ["Clients exceeding their expected preview booking rhythm.", "Հաճախորդներ, որոնց ընդմիջումը գերազանցել է նախադիտման սպասվող ամրագրման ռիթմը։", "Клиенты, превысившие ожидаемый в предпросмотре ритм записей.", "Clients dépassant leur rythme de réservation attendu dans l’aperçu."],
  ["Loyal segment", "Հավատարիմ հատված", "Лояльный сегмент", "Segment fidèle"],
  ["High historical contribution", "Պատմական բարձր ներդրում", "Высокий исторический вклад", "Forte contribution historique"],
  ["Regular segment", "Կանոնավոր հատված", "Регулярный сегмент", "Segment régulier"],
  ["Consistent previous behavior", "Նախկին կայուն վարքագիծ", "Стабильное предыдущее поведение", "Comportement antérieur régulier"],
  ["Action window", "Գործողության պատուհան", "Окно действия", "Fenêtre d’action"],
  ["7 days", "7 օր", "7 дней", "7 jours"],
  ["Recommended review timing", "Վերանայման առաջարկվող ժամկետ", "Рекомендуемый срок проверки", "Moment recommandé pour l’examen"],
  ["Confidence", "Վստահություն", "Уверенность", "Confiance"],
  ["Preview classification strength", "Նախադիտման դասակարգման ուժ", "Надёжность классификации предпросмотра", "Solidité de la classification de l’aperçu"],
  ["Relationship strength", "Հարաբերության ուժ", "Сила взаимоотношений", "Solidité de la relation"],
  ["Historical booking consistency", "Պատմական ամրագրումների կայունություն", "Стабильность прошлых записей", "Régularité historique des réservations"],
  ["Recovery probability", "Վերադարձի հավանականություն", "Вероятность возврата", "Probabilité de récupération"],
  ["Preview likelihood of return", "Նախադիտման վերադարձի հավանականություն", "Вероятность возврата по предпросмотру", "Probabilité de retour dans l’aperçu"],
  ["Revenue importance", "Եկամտային նշանակություն", "Значимость для выручки", "Importance pour les revenus"],
  ["Contribution potential", "Ներդրման ներուժ", "Потенциал вклада", "Potentiel de contribution"],
  ["Urgency", "Հրատապություն", "Срочность", "Urgence"],
  ["Time sensitivity", "Ժամանակային զգայունություն", "Чувствительность ко времени", "Sensibilité temporelle"],
  ["Booking rhythm exceeded", "Ամրագրման ռիթմը գերազանցվել է", "Ритм записей превышен", "Rythme de réservation dépassé"],
  ["The current gap is longer than the segment’s normal preview booking cycle.", "Ընթացիկ ընդմիջումը երկար է հատվածի նախադիտման սովորական ամրագրման ցիկլից։", "Текущий интервал длиннее обычного цикла записей сегмента в предпросмотре.", "L’intervalle actuel dépasse le cycle de réservation habituel du segment dans l’aperçu."],
  ["+21 days", "+21 օր", "+21 день", "+21 jours"],
  ["High-value concentration", "Բարձրարժեք կենտրոնացում", "Концентрация высокой ценности", "Concentration à forte valeur"],
  ["Several clients belong to historically stronger contribution segments.", "Մի քանի հաճախորդ պատկանում է պատմականորեն ավելի բարձր ներդրում ունեցող հատվածներին։", "Несколько клиентов относятся к сегментам с исторически более высоким вкладом.", "Plusieurs clients appartiennent à des segments historiquement plus contributeurs."],
  ["3 clients", "3 հաճախորդ", "3 клиента", "3 clients"],
  ["Recoverable demand", "Վերականգնվող պահանջարկ", "Восстанавливаемый спрос", "Demande récupérable"],
  ["The segment has meaningful recent service affinity.", "Հատվածը վերջերս ցուցադրել է ծառայությունների նշանակալի նախընտրություն։", "Сегмент демонстрирует значимую недавнюю приверженность услугам.", "Le segment présente une affinité récente significative avec les services."],
  ["2 services", "2 ծառայություն", "2 услуги", "2 services"],
  ["Review the segment", "Վերանայել հատվածը", "Проверить сегмент", "Examiner le segment"],
  ["Inspect booking rhythm, service affinity and last completed visit.", "Ստուգեք ամրագրման ռիթմը, ծառայությունների նախընտրությունը և վերջին ավարտված այցը։", "Проверьте ритм записей, предпочтения услуг и последний завершённый визит.", "Examinez le rythme de réservation, l’affinité de service et la dernière visite terminée."],
  ["Choose the message", "Ընտրել հաղորդագրությունը", "Выбрать сообщение", "Choisir le message"],
  ["Use a personalized reactivation approach rather than a generic promotion.", "Օգտագործեք անհատական վերաակտիվացման մոտեցում՝ ընդհանուր ակցիայի փոխարեն։", "Используйте персонализированный подход к реактивации вместо общей акции.", "Utilisez une approche de réactivation personnalisée plutôt qu’une promotion générique."],
  ["Protect margin", "Պաշտպանել մարժան", "Защитить маржу", "Protéger la marge"],
  ["Prioritize service relevance before offering any discount.", "Զեղչ առաջարկելուց առաջ առաջնահերթ դարձրեք ծառայության համապատասխանությունը։", "Перед скидкой отдайте приоритет релевантности услуги.", "Privilégiez la pertinence du service avant toute remise."],
  ["Track return", "Հետևել վերադարձին", "Отслеживать возврат", "Suivre le retour"],
  ["Measure recovered clients and completed revenue after execution.", "Գործարկումից հետո չափեք վերադարձած հաճախորդներին և ավարտված եկամուտը։", "После выполнения измерьте число вернувшихся клиентов и завершённую выручку.", "Mesurez les clients récupérés et le revenu réalisé après exécution."],
  ["POTENTIAL PREVIEW RECOVERY", "ՆԱԽԱԴԻՏՄԱՆ ՀՆԱՐԱՎՈՐ ՎԵՐԱԴԱՐՁ", "ПОТЕНЦИАЛЬНОЕ ВОССТАНОВЛЕНИЕ ПРЕДПРОСМОТРА", "RÉCUPÉRATION POTENTIELLE DE L’APERÇU"],
  ["The real-data phase will calculate at-risk status from documented booking-cycle rules, never arbitrary labels.", "Իրական տվյալների փուլում ռիսկային կարգավիճակը կհաշվարկվի ամրագրման ցիկլի փաստաթղթավորված կանոններով, ոչ երբեք կամայական պիտակներով։", "На этапе реальных данных статус риска будет рассчитываться по документированным правилам цикла записей, а не по произвольным меткам.", "La phase de données réelles calculera le statut à risque selon des règles documentées du cycle de réservation, jamais selon des étiquettes arbitraires."],
  ["SERVICE GROWTH INTELLIGENCE", "ԾԱՌԱՅՈՒԹՅՈՒՆՆԵՐԻ ԱՃԻ ԻՆՏԵԼԵԿՏ", "АНАЛИТИКА РОСТА УСЛУГ", "INTELLIGENCE DE CROISSANCE DES SERVICES"],
  ["Scale Your Strongest Service", "Աճեցնել ամենաուժեղ ծառայությունը", "Масштабировать сильнейшую услугу", "Développer votre service le plus performant"],
  ["A complete service-performance view combining demand, revenue contribution and growth potential.", "Ծառայության կատարողականության ամբողջական տեսք՝ պահանջարկի, եկամտային ներդրման և աճի ներուժի համադրմամբ։", "Полный обзор эффективности услуги, объединяющий спрос, вклад в выручку и потенциал роста.", "Vue complète de la performance du service combinant demande, contribution aux revenus et potentiel de croissance."],
  ["Preview service revenue", "Ծառայության նախադիտման եկամուտ", "Выручка услуги в предпросмотре", "Revenu du service dans l’aperçu"],
  ["Balayage Signature leads the current design scenario.", "Balayage Signature-ը առաջատար է ընթացիկ դիզայնի սցենարում։", "Balayage Signature лидирует в текущем дизайн-сценарии.", "Balayage Signature domine le scénario de conception actuel."],
  ["Preview completed and scheduled demand", "Նախադիտման ավարտված և պլանավորված պահանջարկ", "Завершённый и запланированный спрос предпросмотра", "Demande terminée et planifiée de l’aperçu"],
  ["Relative demand", "Հարաբերական պահանջարկ", "Относительный спрос", "Demande relative"],
  ["Compared with the leading service", "Առաջատար ծառայության համեմատ", "По сравнению с ведущей услугой", "Par rapport au service leader"],
  ["Period growth", "Ժամանակահատվածի աճ", "Рост за период", "Croissance de la période"],
  ["Preview period comparison", "Նախադիտման ժամանակահատվածի համեմատություն", "Сравнение периода предпросмотра", "Comparaison de la période d’aperçu"],
  ["Completion", "Ավարտում", "Завершение", "Finalisation"],
  ["Operational fulfillment signal", "Գործառնական կատարման ազդանշան", "Сигнал операционного выполнения", "Signal d’exécution opérationnelle"],
  ["Revenue contribution", "Եկամտային ներդրում", "Вклад в выручку", "Contribution aux revenus"],
  ["Relative service contribution", "Ծառայության հարաբերական ներդրում", "Относительный вклад услуги", "Contribution relative du service"],
  ["Booking velocity", "Ամրագրումների արագություն", "Скорость записей", "Vélocité des réservations"],
  ["Demand momentum", "Պահանջարկի դինամիկա", "Динамика спроса", "Dynamique de la demande"],
  ["Client repeat signal", "Հաճախորդի կրկնության ազդանշան", "Сигнал повторных визитов", "Signal de récurrence client"],
  ["Preview repeat-service affinity", "Նախադիտման կրկնվող ծառայության նախընտրություն", "Приверженность повторной услуге в предпросмотре", "Affinité de répétition du service dans l’aperçu"],
  ["Promotion readiness", "Առաջխաղացման պատրաստակամություն", "Готовность к продвижению", "Préparation à la promotion"],
  ["Growth opportunity strength", "Աճի հնարավորության ուժ", "Сила возможности роста", "Solidité de l’opportunité de croissance"],
  ["Demand leadership", "Պահանջարկի առաջատարություն", "Лидерство спроса", "Leadership de la demande"],
  ["This service ranks first in the preview service-performance model.", "Այս ծառայությունն առաջինն է նախադիտման ծառայությունների կատարողականության մոդելում։", "Эта услуга занимает первое место в модели эффективности услуг предпросмотра.", "Ce service se classe premier dans le modèle de performance des services de l’aperçu."],
  ["Strong revenue quality", "Եկամտի բարձր որակ", "Высокое качество выручки", "Forte qualité des revenus"],
  ["The service combines booking volume with a high average value.", "Ծառայությունը համադրում է ամրագրումների ծավալը բարձր միջին արժեքի հետ։", "Услуга сочетает объём записей с высокой средней стоимостью.", "Le service combine un volume de réservations avec une valeur moyenne élevée."],
  ["Repeat behavior", "Կրկնվող վարքագիծ", "Повторное поведение", "Comportement récurrent"],
  ["Returning clients show stronger affinity than first-time clients.", "Վերադարձող հաճախորդները ցույց են տալիս ավելի ուժեղ նախընտրություն, քան առաջին անգամ այցելողները։", "Вернувшиеся клиенты проявляют более сильную приверженность, чем новые.", "Les clients récurrents montrent une affinité plus forte que les nouveaux clients."],
  ["Protect delivery quality", "Պաշտպանել մատուցման որակը", "Защитить качество оказания", "Protéger la qualité de prestation"],
  ["Ensure increased promotion does not reduce service consistency.", "Համոզվեք, որ ավելացված առաջխաղացումը չի նվազեցնում ծառայության կայունությունը։", "Убедитесь, что усиление продвижения не снижает стабильность услуги.", "Veillez à ce que la promotion accrue ne réduise pas la régularité du service."],
  ["Target the right segment", "Թիրախավորել ճիշտ հատվածը", "Выбрать правильный сегмент", "Cibler le bon segment"],
  ["Focus on clients whose service history supports the recommendation.", "Կենտրոնացեք այն հաճախորդների վրա, որոնց ծառայությունների պատմությունը հիմնավորում է առաջարկությունը։", "Сосредоточьтесь на клиентах, чья история услуг подтверждает рекомендацию.", "Ciblez les clients dont l’historique de services soutient la recommandation."],
  ["Select the period", "Ընտրել ժամանակահատվածը", "Выбрать период", "Sélectionner la période"],
  ["Promote during capacity windows with available operational room.", "Առաջխաղացրեք այն ժամանակահատվածներում, երբ առկա է գործառնական ազատ հզորություն։", "Продвигайте услугу в периоды с доступной операционной мощностью.", "Faites la promotion pendant les créneaux disposant d’une capacité opérationnelle."],
  ["Measure contribution", "Չափել ներդրումը", "Измерить вклад", "Mesurer la contribution"],
  ["Track completed bookings, revenue and repeat-service behavior.", "Հետևեք ավարտված ամրագրումներին, եկամտին և կրկնվող ծառայության վարքագծին։", "Отслеживайте завершённые записи, выручку и повторное использование услуги.", "Suivez les réservations terminées, les revenus et le comportement de répétition du service."],
  ["PREVIEW GROWTH OPPORTUNITY", "ՆԱԽԱԴԻՏՄԱՆ ԱՃԻ ՀՆԱՐԱՎՈՐՈՒԹՅՈՒՆ", "ВОЗМОЖНОСТЬ РОСТА ПРЕДПРОСМОТРА", "OPPORTUNITÉ DE CROISSANCE DE L’APERÇU"],
  ["The production phase will derive service intelligence from real appointment-service relationships and price snapshots.", "Արտադրական փուլում ծառայությունների ինտելեկտը կստացվի իրական այց-ծառայություն կապերից և գների պահային պատկերներից։", "На производственном этапе аналитика услуг будет формироваться из реальных связей записей с услугами и снимков цен.", "La phase de production dérivera l’intelligence des services des relations réelles rendez-vous–service et des instantanés de prix."],
  ["RISK REDUCTION PLAYBOOK", "ՌԻՍԿԻ ՆՎԱԶԵՑՄԱՆ ԳՈՐԾՈՂՈՒԹՅՈՒՆՆԵՐԻ ՊԼԱՆ", "ПЛАН СНИЖЕНИЯ РИСКОВ", "PLAN DE RÉDUCTION DES RISQUES"],
  ["Reduce Cancellation Friction", "Նվազեցնել չեղարկումների խոչընդոտները", "Снизить трение при отменах", "Réduire les frictions d’annulation"],
  ["A structured operational playbook for understanding and protecting avoidable appointment value.", "Կառուցվածքային գործառնական պլան՝ կանխարգելելի այցերի արժեքը հասկանալու և պաշտպանելու համար։", "Структурированный операционный план для анализа и защиты предотвратимой стоимости записей.", "Plan opérationnel structuré pour comprendre et protéger la valeur évitable des rendez-vous."],
  ["Preview protected value", "Նախադիտման պաշտպանվող արժեք", "Защищаемая стоимость предпросмотра", "Valeur protégée de l’aperçu"],
  ["Potential appointment value exposed to avoidable cancellation risk.", "Այցերի հնարավոր արժեք, որը ենթարկված է կանխարգելելի չեղարկման ռիսկի։", "Потенциальная стоимость записей под риском предотвратимой отмены.", "Valeur potentielle des rendez-vous exposée à un risque d’annulation évitable."],
  ["Cancellation rate", "Չեղարկման տոկոս", "Доля отмен", "Taux d’annulation"],
  ["Current preview period", "Նախադիտման ընթացիկ շրջան", "Текущий период предпросмотра", "Période d’aperçu actuelle"],
  ["Affected bookings", "Ազդված ամրագրումներ", "Затронутые записи", "Réservations concernées"],
  ["Cancelled appointments", "Չեղարկված այցեր", "Отменённые записи", "Rendez-vous annulés"],
  ["High-value exposure", "Բարձրարժեք ազդեցություն", "Подверженность высокой ценности", "Exposition à forte valeur"],
  ["Priority appointments", "Առաջնահերթ այցեր", "Приоритетные записи", "Rendez-vous prioritaires"],
  ["Preview recommendation strength", "Նախադիտման առաջարկության ուժ", "Надёжность рекомендации предпросмотра", "Solidité de la recommandation de l’aperçu"],
  ["Revenue exposure", "Եկամտային ազդեցություն", "Подверженность выручки", "Exposition des revenus"],
  ["Potential value at risk", "Ռիսկի տակ գտնվող հնարավոր արժեք", "Потенциальная стоимость под риском", "Valeur potentielle à risque"],
  ["Operational urgency", "Գործառնական հրատապություն", "Операционная срочность", "Urgence opérationnelle"],
  ["Timing importance", "Ժամանակի կարևորություն", "Важность сроков", "Importance du timing"],
  ["Preventability", "Կանխարգելելիություն", "Предотвратимость", "Prévisibilité"],
  ["Estimated avoidable share", "Կանխարգելելի մասի գնահատում", "Оценочная предотвратимая доля", "Part évitable estimée"],
  ["Implementation effort", "Իրականացման ջանք", "Усилия внедрения", "Effort de mise en œuvre"],
  ["Relative execution complexity", "Իրականացման հարաբերական բարդություն", "Относительная сложность выполнения", "Complexité relative d’exécution"],
  ["Several cancellations appear in stronger-value appointment segments.", "Մի քանի չեղարկում առկա է ավելի բարձրարժեք այցերի հատվածներում։", "Несколько отмен относятся к сегментам записей с более высокой ценностью.", "Plusieurs annulations apparaissent dans des segments de rendez-vous à plus forte valeur."],
  ["6 bookings", "6 ամրագրում", "6 записей", "6 réservations"],
  ["Timing pattern", "Ժամանակային օրինաչափություն", "Временной паттерн", "Schéma temporel"],
  ["The preview pattern suggests risk increases close to the appointment.", "Նախադիտման օրինաչափությունը ցույց է տալիս, որ ռիսկը աճում է այցին մոտ ժամանակահատվածում։", "Предпросмотр показывает рост риска по мере приближения записи.", "Le schéma d’aperçu suggère que le risque augmente à l’approche du rendez-vous."],
  ["< 24 hours", "< 24 ժամ", "< 24 часов", "< 24 heures"],
  ["Service dependency", "Ծառայությունից կախվածություն", "Зависимость от услуги", "Dépendance au service"],
  ["A small number of services carry most exposed value.", "Ծառայությունների փոքր քանակը կրում է ազդեցության ենթակա արժեքի մեծ մասը։", "Небольшое число услуг несёт большую часть подверженной риску стоимости.", "Un petit nombre de services concentre la majorité de la valeur exposée."],
  ["Segment the risk", "Բաժանել ռիսկը հատվածների", "Сегментировать риск", "Segmenter le risque"],
  ["Separate early cancellations, late cancellations and no-shows.", "Տարանջատեք վաղ չեղարկումները, ուշ չեղարկումները և չներկայանալը։", "Разделите ранние отмены, поздние отмены и неявки.", "Séparez les annulations anticipées, tardives et les absences."],
  ["Improve confirmation", "Բարելավել հաստատումը", "Улучшить подтверждение", "Améliorer la confirmation"],
  ["Use timely reminders appropriate to appointment value and lead time.", "Օգտագործեք այցի արժեքին և նախնական ժամկետին համապատասխան ժամանակին հիշեցումներ։", "Используйте своевременные напоминания с учётом стоимости записи и времени до визита.", "Utilisez des rappels opportuns adaptés à la valeur du rendez-vous et au délai."],
  ["Protect capacity", "Պաշտպանել հզորությունը", "Защитить загрузку", "Protéger la capacité"],
  ["Create a controlled recovery process for newly available slots.", "Ստեղծեք վերահսկվող վերականգնման գործընթաց նոր ազատված ժամերի համար։", "Создайте контролируемый процесс заполнения вновь освободившихся слотов.", "Créez un processus contrôlé de récupération des créneaux nouvellement libérés."],
  ["Measure prevention", "Չափել կանխարգելումը", "Измерить предотвращение", "Mesurer la prévention"],
  ["Compare cancellation rate and protected completed revenue.", "Համեմատեք չեղարկման տոկոսը և պաշտպանված ավարտված եկամուտը։", "Сравните долю отмен и защищённую завершённую выручку.", "Comparez le taux d’annulation et le revenu réalisé protégé."],
  ["PREVIEW VALUE PROTECTION", "ՆԱԽԱԴԻՏՄԱՆ ԱՐԺԵՔԻ ՊԱՇՏՊԱՆՈՒԹՅՈՒՆ", "ЗАЩИТА СТОИМОСТИ ПРЕДПРОСМОТРА", "PROTECTION DE LA VALEUR DE L’APERÇU"],
  ["The production engine will separate cancelled, no-show and completed statuses before calculating avoidable value.", "Արտադրական շարժիչը կանխարգելելի արժեքը հաշվարկելուց առաջ կտարանջատի չեղարկված, չներկայացած և ավարտված կարգավիճակները։", "Производственный движок разделит статусы отмены, неявки и завершения до расчёта предотвратимой стоимости.", "Le moteur de production séparera les statuts annulé, absence et terminé avant de calculer la valeur évitable."],
  ["Client Reactivation Intelligence", "Հաճախորդների վերաակտիվացման ինտելեկտ", "Аналитика реактивации клиентов", "Intelligence de réactivation client"],
  ["Service Growth Intelligence", "Ծառայությունների աճի ինտելեկտ", "Аналитика роста услуг", "Intelligence de croissance des services"],
  ["Cancellation Risk Playbook", "Չեղարկման ռիսկի գործողությունների պլան", "План управления риском отмен", "Plan de gestion du risque d’annulation"],
  ["LIVE CLIENT INTELLIGENCE", "ՀԱՃԱԽՈՐԴՆԵՐԻ ԻՐԱԿԱՆ ԻՆՏԵԼԵԿՏ", "РЕАЛЬНАЯ АНАЛИТИКА КЛИЕНТОВ", "INTELLIGENCE CLIENT EN DIRECT"],
  ["LIVE SERVICE INTELLIGENCE", "ԾԱՌԱՅՈՒԹՅՈՒՆՆԵՐԻ ԻՐԱԿԱՆ ԻՆՏԵԼԵԿՏ", "РЕАЛЬНАЯ АНАЛИТИКА УСЛУГ", "INTELLIGENCE SERVICE EN DIRECT"],
  ["LIVE RISK INTELLIGENCE", "ՌԻՍԿԻ ԻՐԱԿԱՆ ԻՆՏԵԼԵԿՏ", "РЕАЛЬНАЯ АНАЛИТИКА РИСКОВ", "INTELLIGENCE DU RISQUE EN DIRECT"],
  ["LIVE EXECUTIVE INTELLIGENCE", "ԻՐԱԿԱՆ ԳՈՐԾԱԴԻՐ ԻՆՏԵԼԵԿՏ", "РЕАЛЬНАЯ ИСПОЛНИТЕЛЬНАЯ АНАЛИТИКА", "INTELLIGENCE EXÉCUTIVE EN DIRECT"],
  ["No active service", "Ակտիվ ծառայություն չկա", "Нет активной услуги", "Aucun service actif"],
  ["Cancellation Rate", "Չեղարկման տոկոս", "Доля отмен", "Taux d’annulation"],
  ["selected-period appointments", "ընտրված ժամանակահատվածի այցեր", "записи выбранного периода", "rendez-vous de la période sélectionnée"],
  ["Completed Revenue", "Ավարտված եկամուտ", "Завершённая выручка", "Revenu réalisé"],
  ["Average Ticket", "Միջին վճարում", "Средний чек", "Panier moyen"],
  ["Close live intelligence", "Փակել իրական ինտելեկտը", "Закрыть реальную аналитику", "Fermer l’intelligence en direct"],
  ["Generated from the selected real-data period model.", "Ստեղծվել է ընտրված իրական տվյալների ժամանակահատվածի մոդելից։", "Сформировано по модели выбранного периода реальных данных.", "Généré à partir du modèle de données réelles de la période sélectionnée."],
  ["{count} bookings · {share}% relative demand", "{count} ամրագրում · {share}% հարաբերական պահանջարկ", "{count} записей · {share}% относительного спроса", "{count} réservations · {share}% de demande relative"],
  ["REAL SUPPORTING SIGNALS", "ԻՐԱԿԱՆ ՀԻՄՆԱՎՈՐՈՂ ԱԶԴԱՆՇԱՆՆԵՐ", "РЕАЛЬНЫЕ ПОДТВЕРЖДАЮЩИЕ СИГНАЛЫ", "SIGNAUX RÉELS À L’APPUI"],
  ["Evidence from the selected period", "Ապացույցներ ընտրված ժամանակահատվածից", "Данные выбранного периода", "Éléments de la période sélectionnée"],
  ["RECOMMENDED DECISION", "ԱՌԱՋԱՐԿՎՈՂ ՈՐՈՇՈՒՄ", "РЕКОМЕНДУЕМОЕ РЕШЕНИЕ", "DÉCISION RECOMMANDÉE"],
  ["CALCULATED IMPACT", "ՀԱՇՎԱՐԿՎԱԾ ԱԶԴԵՑՈՒԹՅՈՒՆ", "РАСЧЁТНЫЙ ЭФФЕКТ", "IMPACT CALCULÉ"],
  ["These signals are calculated deterministically from loaded appointment, client and service records. Other-currency records are excluded from selected-currency totals.", "Այս ազդանշանները որոշակիորեն հաշվարկվում են բեռնված այցերի, հաճախորդների և ծառայությունների գրառումներից։ Այլ արժույթով գրառումները բացառվում են ընտրված արժույթի ընդհանուր գումարներից։", "Эти сигналы детерминированно рассчитываются по загруженным записям о визитах, клиентах и услугах. Записи в других валютах исключаются из итогов выбранной валюты.", "Ces signaux sont calculés de manière déterministe à partir des enregistrements chargés de rendez-vous, clients et services. Les enregistrements dans d’autres devises sont exclus des totaux de la devise sélectionnée."],
  ["REVENUE INTELLIGENCE", "ԵԿԱՄՏԻ ՎԵՐԼՈՒԾՈՒԹՅՈՒՆ", "АНАЛИТИКА ВЫРУЧКИ", "INTELLIGENCE DES REVENUS"],
  ["Revenue Pulse", "Եկամտի դինամիկա", "Динамика выручки", "Dynamique des revenus"],
  ["Completed revenue compared with the previous selected period.", "Ավարտված եկամուտը՝ նախորդ ընտրված ժամանակահատվածի համեմատ։", "Завершённая выручка по сравнению с предыдущим выбранным периодом.", "Revenu réalisé comparé à la période sélectionnée précédente."],
  ["Completed revenue compared with the previous preview period.", "Ավարտված եկամուտը՝ նախորդ նախադիտման ժամանակահատվածի համեմատ։", "Завершённая выручка по сравнению с предыдущим периодом предпросмотра.", "Revenu réalisé comparé à la période d’aperçu précédente."],
  ["Live data", "Իրական տվյալներ", "Реальные данные", "Données réelles"],
  ["Live preview", "Ուղիղ նախադիտում", "Предпросмотр в реальном времени", "Aperçu en direct"],
  ["Current period", "Ընթացիկ ժամանակահատված", "Текущий период", "Période actuelle"],
  ["Previous period", "Նախորդ ժամանակահատված", "Предыдущий период", "Période précédente"],
  ["AI EXECUTIVE BRIEF", "AI ԳՈՐԾԱԴԻՐ ԱՄՓՈՓՈՒՄ", "ИСПОЛНИТЕЛЬНАЯ СВОДКА ИИ", "SYNTHÈSE EXÉCUTIVE IA"],
  ["Business Health", "Բիզնեսի առողջություն", "Состояние бизнеса", "Santé de l’activité"],
  ["A focused summary of the strongest business signal.", "Բիզնեսի ամենաուժեղ ազդանշանի հակիրճ ամփոփում։", "Краткая сводка самого сильного бизнес-сигнала.", "Synthèse ciblée du signal métier le plus fort."],
  ["of 100", "100-ից", "из 100", "sur 100"],
  ["Strong momentum with a clear next move.", "Ուժեղ դինամիկա՝ հստակ հաջորդ քայլով։", "Уверенная динамика с понятным следующим шагом.", "Forte dynamique avec une prochaine étape claire."],
  ["PRIMARY SIGNAL", "ՀԻՄՆԱԿԱՆ ԱԶԴԱՆՇԱՆ", "ОСНОВНОЙ СИГНАЛ", "SIGNAL PRINCIPAL"],
  ["BEST NEXT ACTION", "ԼԱՎԱԳՈՒՅՆ ՀԱՋՈՐԴ ՔԱՅԼ", "ЛУЧШЕЕ СЛЕДУЮЩЕЕ ДЕЙСТВИЕ", "MEILLEURE PROCHAINE ACTION"],
  ["Open intelligence details", "Բացել վերլուծության մանրամասները", "Открыть подробности аналитики", "Ouvrir les détails de l’analyse"],
  ["BOOKINGS", "ԱՄՐԱԳՐՈՒՄՆԵՐ", "ЗАПИСИ", "RÉSERVATIONS"],
  ["OPERATIONS", "ԳՈՐԾԱՌՆՈՒԹՅՈՒՆՆԵՐ", "ОПЕРАЦИИ", "OPÉRATIONS"],
  ["Booking Status", "Ամրագրումների կարգավիճակ", "Статус записей", "Statut des réservations"],
  ["A clean view of appointment flow.", "Այցերի հոսքի հստակ պատկեր։", "Наглядное представление потока записей.", "Vue claire du flux des rendez-vous."],
  ["SERVICE INTELLIGENCE", "ԾԱՌԱՅՈՒԹՅՈՒՆՆԵՐԻ ՎԵՐԼՈՒԾՈՒԹՅՈՒՆ", "АНАЛИТИКА УСЛУГ", "INTELLIGENCE DES SERVICES"],
  ["Top Services", "Լավագույն ծառայություններ", "Лучшие услуги", "Meilleurs services"],
  ["Revenue and demand contribution.", "Ներդրումը եկամտի և պահանջարկի մեջ։", "Вклад в выручку и спрос.", "Contribution aux revenus et à la demande."],
  ["Performance Ranking", "Կատարողականության վարկանիշ", "Рейтинг эффективности", "Classement des performances"],
  ["A professional view of revenue contribution and relative demand.", "Եկամտային ներդրման և հարաբերական պահանջարկի մասնագիտական պատկեր։", "Профессиональный обзор вклада в выручку и относительного спроса.", "Vue professionnelle de la contribution aux revenus et de la demande relative."],
  ["CLIENT INTELLIGENCE", "ՀԱՃԱԽՈՐԴՆԵՐԻ ՎԵՐԼՈՒԾՈՒԹՅՈՒՆ", "АНАЛИТИКА КЛИЕНТОВ", "INTELLIGENCE CLIENT"],
  ["Client Health", "Հաճախորդային բազայի առողջություն", "Состояние клиентской базы", "Santé des clients"],
  ["Retention, acquisition and risk signals.", "Պահպանման, ներգրավման և ռիսկի ազդանշաններ։", "Сигналы удержания, привлечения и риска.", "Signaux de fidélisation, d’acquisition et de risque."],
  ["Retention and relationship quality.", "Պահպանում և հարաբերությունների որակ։", "Удержание и качество отношений.", "Fidélisation et qualité de la relation."],
  ["OPERATIONS INTELLIGENCE", "ԳՈՐԾԱՌՆԱԿԱՆ ՎԵՐԼՈՒԾՈՒԹՅՈՒՆ", "ОПЕРАЦИОННАЯ АНАЛИТИКА", "INTELLIGENCE OPÉRATIONNELLE"],
  ["Demand Heatmap", "Պահանջարկի ջերմային քարտեզ", "Тепловая карта спроса", "Carte thermique de la demande"],
  ["Appointment intensity by weekday and hour.", "Այցերի ինտենսիվությունը՝ ըստ շաբաթվա օրվա և ժամի։", "Интенсивность записей по дням недели и часам.", "Intensité des rendez-vous par jour et par heure."],
  ["Appointment intensity across the working week.", "Այցերի ինտենսիվությունը աշխատանքային շաբաթվա ընթացքում։", "Интенсивность записей в течение рабочей недели.", "Intensité des rendez-vous sur la semaine de travail."],
  ["AI MISSION CONTROL", "AI ԱՌԱՋԱԴՐԱՆՔՆԵՐԻ ԿԵՆՏՐՈՆ", "ЦЕНТР УПРАВЛЕНИЯ ИИ", "CENTRE DE MISSION IA"],
  ["Recommended Actions", "Առաջարկվող գործողություններ", "Рекомендуемые действия", "Actions recommandées"],
  ["Prioritized decisions with evidence and potential impact.", "Առաջնահերթ որոշումներ՝ հիմնավորումներով և հնարավոր ազդեցությամբ։", "Приоритетные решения с обоснованием и потенциальным эффектом.", "Décisions priorisées avec preuves et impact potentiel."],
  ["bookings", "ամրագրում", "записей", "réservations"],
  ["relative demand", "հարաբերական պահանջարկ", "относительного спроса", "de demande relative"],
  ["confidence", "վստահություն", "уверенности", "de confiance"],
  ["EXPECTED IMPACT", "ՍՊԱՍՎՈՂ ԱԶԴԵՑՈՒԹՅՈՒՆ", "ОЖИДАЕМЫЙ ЭФФЕКТ", "IMPACT ATTENDU"],
  ["STATUS FLOW", "ԿԱՐԳԱՎԻՃԱԿՆԵՐԻ ՀՈՍՔ", "ПОТОК СТАТУСОВ", "FLUX DES STATUTS"],
  ["Operational composition.", "Գործառնական կառուցվածք։", "Операционная структура.", "Composition opérationnelle."],
  ["CAPACITY SIGNAL", "ՀԶՈՐՈՒԹՅԱՆ ԱԶԴԱՆՇԱՆ", "СИГНАЛ ЗАГРУЗКИ", "SIGNAL DE CAPACITÉ"],
  ["OPPORTUNITY MATRIX", "ՀՆԱՐԱՎՈՐՈՒԹՅՈՒՆՆԵՐԻ ՄԱՏՐԻՑԱ", "МАТРИЦА ВОЗМОЖНОСТЕЙ", "MATRICE DES OPPORTUNITÉS"],
  ["Impact vs Effort", "Ազդեցություն և ջանք", "Эффект и усилия", "Impact et effort"],
  ["A strategic prioritization system for business opportunities.", "Բիզնես հնարավորությունների ռազմավարական առաջնահերթությունների համակարգ։", "Система стратегической приоритизации бизнес-возможностей.", "Système de priorisation stratégique des opportunités commerciales."],
  ["Mon", "Երկ", "Пн", "Lun"],
  ["Tue", "Երք", "Вт", "Mar"],
  ["Wed", "Չրք", "Ср", "Mer"],
  ["Thu", "Հնգ", "Чт", "Jeu"],
  ["Fri", "Ուրբ", "Пт", "Ven"],
  ["Sat", "Շբթ", "Сб", "Sam"],
  ["Sun", "Կիր", "Вс", "Dim"],
] as const;

const ANALYTICS_V2_SURFACE_CATALOG: Record<
  AnalyticsV2UiLocale,
  Record<string, string>
> = {
  en: Object.fromEntries(
    ANALYTICS_V2_SURFACE_ROWS.map(([en]) => [en, en])
  ),
  hy: Object.fromEntries(
    ANALYTICS_V2_SURFACE_ROWS.map(([en, hy]) => [en, hy])
  ),
  ru: Object.fromEntries(
    ANALYTICS_V2_SURFACE_ROWS.map(([en, , ru]) => [en, ru])
  ),
  fr: Object.fromEntries(
    ANALYTICS_V2_SURFACE_ROWS.map(([en, , , fr]) => [en, fr])
  ),
};

export function analyticsV2SurfaceT(
  locale: string | null | undefined,
  source: string,
  params: AnalyticsV2Params = {}
): string {
  const normalized =
    normalizeAnalyticsV2UiLocale(locale);

  const template =
    ANALYTICS_V2_SURFACE_CATALOG[normalized][source] ??
    source;

  return Object.entries(params).reduce(
    (result, [name, value]) =>
      result
        .split(`{${name}}`)
        .join(String(value)),
    template
  );
}
