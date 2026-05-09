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
