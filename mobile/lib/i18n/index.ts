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
      upcoming: "Առաջիկա",
      scheduled: "Պլանավորված",
      completed: "Ավարտված",
      cancelled: "Չեղարկված",
      working: "Ընթացքում...",
      creating: "Ստեղծվում է...",

      client: "Հաճախորդ",
      clients: "Հաճախորդներ",
      fullName: "Ամբողջական անուն",
      phone: "Հեռախոս",
      email: "Էլ. փոստ",
      notes: "Նշումներ",
      createClient: "Ստեղծել հաճախորդ",
      createClientEntry: "Ստեղծել հաճախորդի գրառում",
      clientSnapshot: "Հաճախորդների պատկերը",
      noClientsYet: "Հաճախորդներ դեռ չկան",
      noMatchingClients: "Համընկնող հաճախորդներ չկան",
      searchClients: "Որոնել հաճախորդների մեջ...",
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
      email: "Эл. почта",
      notes: "Заметки",
      createClient: "Создать клиента",
      createClientEntry: "Создать запись клиента",
      clientSnapshot: "Снимок клиентов",
      noClientsYet: "Клиентов пока нет",
      noMatchingClients: "Совпадающих клиентов нет",
      searchClients: "Поиск клиентов...",
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
      today: "Aujourd’hui",
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
    },
  },
};

function getByPath(obj: TranslationTree, path: string): string | TranslationTree | undefined {
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
