from __future__ import annotations

from collections.abc import Mapping
from datetime import date, datetime
from typing import Any

from app.reports.models import ReportLocale


REPORT_DOCUMENT_TEXT: dict[str, dict[str, str]] = {
    "en": {
        "brand": "SALONFLOWAI",
        "report": "Report",
        "period": "Reporting period",
        "timezone": "Salon timezone",
        "generated_at": "Generated",
        "locale": "Language",
        "theme": "Visual theme",
        "metrics": "Key metrics",
        "metric": "Metric",
        "rows": "Report details",
        "warnings": "Attention",
        "value": "Value",
        "filters": "Filters",
        "yes": "Yes",
        "no": "No",
        "theme_royal_cosmos": "Royal Cosmos",
        "theme_royal_gold_cosmos": "Royal Gold Cosmos",
        "footer": "SalonFlowAI · Confidential operational report",
        "daily-summary": "Daily Summary",
        "appointments": "Appointments",
        "revenue-summary": "Revenue Summary",
        "client-summary": "Client Summary",
        "service-performance": "Service Performance",
        "capacity-utilization": "Capacity Utilization",
        "timezone_fallback_utc": "Salon timezone unavailable; UTC was used.",
        "currency": "Currency",
        "total_appointments": "Total appointments",
        "appointments_on_date": "Appointments on report date",
        "scheduled_on_date": "Scheduled on report date",
        "completed_on_date": "Completed on report date",
        "cancelled_on_date": "Cancelled on report date",
        "completed_booking_count": "Completed bookings",
        "gross_revenue_minor": "Gross revenue",
        "previous_gross_revenue_minor": "Previous period revenue",
        "average_ticket_minor": "Average ticket",
        "total_client_count": "Total clients",
        "new_client_count": "New clients",
        "active_client_count": "Active clients",
        "returning_client_count": "Returning clients",
        "historically_active_client_count": "Historically active clients",
        "at_risk_client_count": "At-risk clients",
        "high_value_client_count": "High-value clients",
        "completed_revenue_minor": "Completed revenue",
        "total_service_count": "Total services",
        "active_service_count": "Active services",
        "total_slots": "Total capacity slots",
        "booked_slots": "Booked slots",
        "active_staff_count": "Active staff",
        "available_minutes": "Available minutes",
        "booked_minutes": "Booked minutes",
        "start": "Start",
        "client": "Client",
        "service": "Service",
        "status": "Status",
        "notes": "Notes",
        "service_id": "Service ID",
        "name": "Service",
        "catalog_present": "In catalog",
        "is_active": "Active",
        "duration_minutes": "Duration",
        "configured_price_minor": "Listed price",
        "appointment_count": "Appointments",
        "scheduled_booking_count": "Scheduled bookings",
        "cancelled_booking_count": "Cancelled bookings",
        "starts_at": "Start",
        "client_name": "Client",
        "service_name": "Service",
        "scheduled": "Scheduled",
        "completed": "Completed",
        "cancelled": "Cancelled",
    },
    "hy": {
        "brand": "SALONFLOWAI",
        "report": "Հաշվետվություն",
        "period": "Հաշվետու ժամանակահատված",
        "timezone": "Սրահի ժամային գոտի",
        "generated_at": "Ստեղծված է",
        "locale": "Լեզու",
        "theme": "Տեսողական թեմա",
        "metrics": "Հիմնական ցուցանիշներ",
        "metric": "Ցուցիչ",
        "rows": "Հաշվետվության մանրամասներ",
        "warnings": "Ուշադրություն",
        "value": "Արժեք",
        "filters": "Ֆիլտրեր",
        "yes": "Այո",
        "no": "Ոչ",
        "theme_royal_cosmos": "Royal Cosmos",
        "theme_royal_gold_cosmos": "Royal Gold Cosmos",
        "footer": "SalonFlowAI · Սրահի ներքին գործառնական հաշվետվություն",
        "daily-summary": "Օրական ամփոփում",
        "appointments": "Ամրագրումներ",
        "revenue-summary": "Եկամտի ամփոփում",
        "client-summary": "Հաճախորդների ամփոփում",
        "service-performance": "Ծառայությունների արդյունավետություն",
        "capacity-utilization": "Հզորության օգտագործում",
        "timezone_fallback_utc": "Սրահի ժամային գոտին հասանելի չէր․ կիրառվել է UTC։",
        "currency": "Արժույթ",
        "total_appointments": "Ընդհանուր ամրագրումներ",
        "appointments_on_date": "Ամրագրումներ հաշվետու օրը",
        "scheduled_on_date": "Պլանավորված հաշվետու օրը",
        "completed_on_date": "Ավարտված հաշվետու օրը",
        "cancelled_on_date": "Չեղարկված հաշվետու օրը",
        "completed_booking_count": "Ավարտված ամրագրումներ",
        "gross_revenue_minor": "Համախառն եկամուտ",
        "previous_gross_revenue_minor": "Նախորդ ժամանակահատվածի եկամուտ",
        "average_ticket_minor": "Միջին չեկ",
        "total_client_count": "Ընդհանուր հաճախորդներ",
        "new_client_count": "Նոր հաճախորդներ",
        "active_client_count": "Ակտիվ հաճախորդներ",
        "returning_client_count": "Վերադարձող հաճախորդներ",
        "historically_active_client_count": "Պատմականորեն ակտիվ հաճախորդներ",
        "at_risk_client_count": "Ռիսկային խմբի հաճախորդներ",
        "high_value_client_count": "Բարձր արժեք ունեցող հաճախորդներ",
        "completed_revenue_minor": "Ավարտված եկամուտ",
        "total_service_count": "Ընդհանուր ծառայություններ",
        "active_service_count": "Ակտիվ ծառայություններ",
        "total_slots": "Հզորության ընդհանուր տեղեր",
        "booked_slots": "Ամրագրված տեղեր",
        "active_staff_count": "Ակտիվ աշխատակիցներ",
        "available_minutes": "Հասանելի րոպեներ",
        "booked_minutes": "Ամրագրված րոպեներ",
        "start": "Սկիզբ",
        "client": "Հաճախորդ",
        "service": "Ծառայություն",
        "status": "Կարգավիճակ",
        "notes": "Նշումներ",
        "service_id": "Ծառայության ID",
        "name": "Ծառայություն",
        "catalog_present": "Կատալոգում",
        "is_active": "Ակտիվ",
        "duration_minutes": "Տևողություն",
        "configured_price_minor": "Սահմանված գին",
        "appointment_count": "Ամրագրումներ",
        "scheduled_booking_count": "Պլանավորված ամրագրումներ",
        "cancelled_booking_count": "Չեղարկված ամրագրումներ",
        "starts_at": "Սկիզբ",
        "client_name": "Հաճախորդ",
        "service_name": "Ծառայություն",
        "scheduled": "Պլանավորված",
        "completed": "Ավարտված",
        "cancelled": "Չեղարկված",
    },
    "ru": {
        "brand": "SALONFLOWAI",
        "report": "Отчет",
        "period": "Отчетный период",
        "timezone": "Часовой пояс салона",
        "generated_at": "Создан",
        "locale": "Язык",
        "theme": "Визуальная тема",
        "metrics": "Ключевые показатели",
        "metric": "Показатель",
        "rows": "Детали отчета",
        "warnings": "Внимание",
        "value": "Значение",
        "filters": "Фильтры",
        "yes": "Да",
        "no": "Нет",
        "theme_royal_cosmos": "Royal Cosmos",
        "theme_royal_gold_cosmos": "Royal Gold Cosmos",
        "footer": "SalonFlowAI · Внутренний операционный отчет салона",
        "daily-summary": "Сводка за день",
        "appointments": "Записи",
        "revenue-summary": "Сводка выручки",
        "client-summary": "Сводка по клиентам",
        "service-performance": "Эффективность услуг",
        "capacity-utilization": "Использование мощности",
        "timezone_fallback_utc": "Часовой пояс салона недоступен; использовано UTC.",
        "currency": "Валюта",
        "total_appointments": "Всего записей",
        "appointments_on_date": "Записи за отчетную дату",
        "scheduled_on_date": "Запланировано за отчетную дату",
        "completed_on_date": "Завершено за отчетную дату",
        "cancelled_on_date": "Отменено за отчетную дату",
        "completed_booking_count": "Завершенные записи",
        "gross_revenue_minor": "Валовая выручка",
        "previous_gross_revenue_minor": "Выручка за прошлый период",
        "average_ticket_minor": "Средний чек",
        "total_client_count": "Всего клиентов",
        "new_client_count": "Новые клиенты",
        "active_client_count": "Активные клиенты",
        "returning_client_count": "Вернувшиеся клиенты",
        "historically_active_client_count": "Исторически активные клиенты",
        "at_risk_client_count": "Клиенты группы риска",
        "high_value_client_count": "Ценные клиенты",
        "completed_revenue_minor": "Завершенная выручка",
        "total_service_count": "Всего услуг",
        "active_service_count": "Активные услуги",
        "total_slots": "Всего доступных слотов",
        "booked_slots": "Занятые слоты",
        "active_staff_count": "Активные сотрудники",
        "available_minutes": "Доступные минуты",
        "booked_minutes": "Занятые минуты",
        "start": "Начало",
        "client": "Клиент",
        "service": "Услуга",
        "status": "Статус",
        "notes": "Заметки",
        "service_id": "ID услуги",
        "name": "Услуга",
        "catalog_present": "В каталоге",
        "is_active": "Активна",
        "duration_minutes": "Длительность",
        "configured_price_minor": "Указанная цена",
        "appointment_count": "Записи",
        "scheduled_booking_count": "Запланированные записи",
        "cancelled_booking_count": "Отмененные записи",
        "starts_at": "Начало",
        "client_name": "Клиент",
        "service_name": "Услуга",
        "scheduled": "Запланировано",
        "completed": "Завершено",
        "cancelled": "Отменено",
    },
    "fr": {
        "brand": "SALONFLOWAI",
        "report": "Rapport",
        "period": "Période du rapport",
        "timezone": "Fuseau horaire du salon",
        "generated_at": "Créé le",
        "locale": "Langue",
        "theme": "Thème visuel",
        "metrics": "Indicateurs clés",
        "metric": "Indicateur",
        "rows": "Détails du rapport",
        "warnings": "Attention",
        "value": "Valeur",
        "filters": "Filtres",
        "yes": "Oui",
        "no": "Non",
        "theme_royal_cosmos": "Royal Cosmos",
        "theme_royal_gold_cosmos": "Royal Gold Cosmos",
        "footer": "SalonFlowAI · Rapport opérationnel interne du salon",
        "daily-summary": "Résumé quotidien",
        "appointments": "Rendez-vous",
        "revenue-summary": "Résumé des revenus",
        "client-summary": "Résumé clients",
        "service-performance": "Performance des services",
        "capacity-utilization": "Utilisation de la capacité",
        "timezone_fallback_utc": "Le fuseau du salon est indisponible ; UTC a été utilisé.",
        "currency": "Devise",
        "total_appointments": "Nombre total de rendez-vous",
        "appointments_on_date": "Rendez-vous à la date du rapport",
        "scheduled_on_date": "Planifiés à la date du rapport",
        "completed_on_date": "Terminés à la date du rapport",
        "cancelled_on_date": "Annulés à la date du rapport",
        "completed_booking_count": "Rendez-vous terminés",
        "gross_revenue_minor": "Revenus bruts",
        "previous_gross_revenue_minor": "Revenus de la période précédente",
        "average_ticket_minor": "Panier moyen",
        "total_client_count": "Nombre total de clients",
        "new_client_count": "Nouveaux clients",
        "active_client_count": "Clients actifs",
        "returning_client_count": "Clients de retour",
        "historically_active_client_count": "Clients historiquement actifs",
        "at_risk_client_count": "Clients à risque",
        "high_value_client_count": "Clients à forte valeur",
        "completed_revenue_minor": "Revenus terminés",
        "total_service_count": "Nombre total de services",
        "active_service_count": "Services actifs",
        "total_slots": "Créneaux disponibles",
        "booked_slots": "Créneaux réservés",
        "active_staff_count": "Personnel actif",
        "available_minutes": "Minutes disponibles",
        "booked_minutes": "Minutes réservées",
        "start": "Début",
        "client": "Client",
        "service": "Service",
        "status": "Statut",
        "notes": "Notes",
        "service_id": "ID du service",
        "name": "Service",
        "catalog_present": "Dans le catalogue",
        "is_active": "Actif",
        "duration_minutes": "Durée",
        "configured_price_minor": "Prix affiché",
        "appointment_count": "Rendez-vous",
        "scheduled_booking_count": "Rendez-vous planifiés",
        "cancelled_booking_count": "Rendez-vous annulés",
        "starts_at": "Début",
        "client_name": "Client",
        "service_name": "Service",
        "scheduled": "Planifié",
        "completed": "Terminé",
        "cancelled": "Annulé",
    },
}


def _locale(value: str) -> ReportLocale:
    return value if value in REPORT_DOCUMENT_TEXT else "en"  # type: ignore[return-value]


def text(locale: str, key: str) -> str:
    strings = REPORT_DOCUMENT_TEXT[_locale(locale)]
    english = REPORT_DOCUMENT_TEXT["en"]
    return strings.get(key, english.get(key, _humanize(key)))


def _humanize(key: str) -> str:
    return key.replace("_", " ").strip().capitalize()


def report_title(locale: str, report_type: str) -> str:
    return text(locale, report_type)


def theme_label(locale: str, theme_id: str) -> str:
    return text(
        locale,
        "theme_royal_gold_cosmos"
        if theme_id == "royal_gold_cosmos"
        else "theme_royal_cosmos",
    )


def label_for(locale: str, key: str) -> str:
    special = REPORT_VALUATION_LABELS[
        _locale(locale)
    ].get(key)

    if special is not None:
        return special

    return text(locale, key)


def format_number(value: object, *, locale: str = "en") -> str:
    if isinstance(value, bool):
        return text("en", "yes") if value else text("en", "no")
    if isinstance(value, int):
        formatted = f"{value:,}"
        return (
            formatted.replace(",", "\u202f")
            if locale in {"ru", "fr"}
            else formatted
        )
    if isinstance(value, float):
        formatted = f"{value:,.2f}".rstrip("0").rstrip(".")
        if locale in {"ru", "fr"}:
            return formatted.replace(",", "\u202f").replace(".", ",")
        return formatted
    return str(value)


def format_value(
    locale: str,
    key: str,
    value: Any,
    *,
    currency: str | None = None,
) -> str:
    if value is None:
        return "-"
    if isinstance(value, bool):
        return text(locale, "yes" if value else "no")
    if isinstance(value, (int, float)):
        formatted = format_number(value, locale=locale)
        if key.endswith("_minor") or key in {
            "configured_price_minor",
            "completed_revenue_minor",
        }:
            return f"{formatted} {currency}" if currency else formatted
        return formatted
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Mapping):
        return ", ".join(
            f"{label_for(locale, str(k))}: {format_value(locale, str(k), v, currency=currency)}"
            for k, v in value.items()
        )
    if isinstance(value, (tuple, list)):
        return ", ".join(format_value(locale, key, item, currency=currency) for item in value)
    if isinstance(value, str):
        if value in {"scheduled", "completed", "cancelled"}:
            return text(locale, value)
        return value
    return str(value)


def export_value(locale: str, key: str, value: Any) -> Any:
    if isinstance(value, bool):
        return text(locale, "yes" if value else "no")
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, str) and value in {
        "scheduled",
        "completed",
        "cancelled",
    }:
        return text(locale, value)
    return value


def format_warning(locale: str, value: str) -> str:
    return text(locale, value)


REPORT_VALUATION_LABELS = {
    "en": {
        "source_currency": "Source currency",
        "reporting_currency": "Reporting currency",
        "valuation_state": "Market data state",
        "valuation_source": "Rate source",
        "valuation_timestamp": "Valuation timestamp",
        "valuation_source_timestamp": "Source timestamp",
        "valuation_policy": "Valuation policy",
        "valuation_warning": "Valuation warning",
    },
    "hy": {
        "source_currency": "Սկզբնական արժույթ",
        "reporting_currency": "Հաշվետվության արժույթ",
        "valuation_state": "Շուկայական տվյալների վիճակ",
        "valuation_source": "Փոխարժեքի աղբյուր",
        "valuation_timestamp": "Գնահատման ժամանակը",
        "valuation_source_timestamp": "Աղբյուրի ժամանակը",
        "valuation_policy": "Գնահատման քաղաքականություն",
        "valuation_warning": "Գնահատման զգուշացում",
    },
    "ru": {
        "source_currency": "Исходная валюта",
        "reporting_currency": "Валюта отчёта",
        "valuation_state": "Состояние рыночных данных",
        "valuation_source": "Источник курса",
        "valuation_timestamp": "Время оценки",
        "valuation_source_timestamp": "Время источника",
        "valuation_policy": "Политика оценки",
        "valuation_warning": "Предупреждение оценки",
    },
    "fr": {
        "source_currency": "Devise d’origine",
        "reporting_currency": "Devise du rapport",
        "valuation_state": "État des données de marché",
        "valuation_source": "Source du taux",
        "valuation_timestamp": "Heure de valorisation",
        "valuation_source_timestamp": "Heure de la source",
        "valuation_policy": "Politique de valorisation",
        "valuation_warning": "Avertissement de valorisation",
    },
}


def _report_presentation(document: object):
    from collections.abc import Mapping

    metrics = getattr(
        document,
        "metrics",
        {},
    )

    if not isinstance(metrics, Mapping):
        return None

    presentation = metrics.get(
        "__presentation__"
    )

    return (
        presentation
        if isinstance(
            presentation,
            Mapping,
        )
        else None
    )


def presentation_metric_items(
    document: object,
):
    from collections.abc import Mapping

    presentation = _report_presentation(
        document
    )

    if presentation is not None:
        metrics = presentation.get(
            "export_metrics"
        )

        if isinstance(metrics, Mapping):
            return tuple(
                metrics.items()
            )

    raw = getattr(
        document,
        "metrics",
        {},
    )

    if isinstance(raw, Mapping):
        return tuple(
            (
                key,
                value,
            )
            for key, value in raw.items()
            if str(key) not in {
                "__presentation__",
                "reporting_valuation",
            }
        )

    return ()


def presentation_rows(
    document: object,
):
    presentation = _report_presentation(
        document
    )

    if presentation is not None:
        rows = presentation.get(
            "export_rows"
        )

        if isinstance(
            rows,
            (tuple, list),
        ):
            return rows

    return getattr(
        document,
        "rows",
        (),
    )


def presentation_currency(
    document: object,
) -> str | None:
    presentation = _report_presentation(
        document
    )

    if presentation is not None:
        value = presentation.get(
            "display_currency"
        )

        if isinstance(value, str) and value:
            return value

    metrics = getattr(
        document,
        "metrics",
        {},
    )

    try:
        value = metrics.get(
            "currency"
        )
    except AttributeError:
        return None

    return (
        str(value)
        if value is not None
        else None
    )
