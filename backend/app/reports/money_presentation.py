from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Mapping, Sequence


REPORT_SOURCE_CURRENCY_SCALE = {
    "AMD": Decimal("1"),
    "USD": Decimal("100"),
    "EUR": Decimal("100"),
    "RUB": Decimal("100"),
}

REPORT_DISPLAY_DECIMALS = {
    "AMD": 0,
    "USD": 2,
    "EUR": 2,
    "RUB": 2,
    "BTC": 8,
}

REPORT_PRESENTATION_ASSETS = frozenset(
    REPORT_DISPLAY_DECIMALS
)


_POLICY = {
    "en": (
        "Market valuation at report generation time; "
        "not historical accounting FX."
    ),
    "hy": (
        "Շուկայական գնահատում՝ հաշվետվության ստեղծման պահին․ "
        "սա պատմական հաշվապահական փոխարժեք չէ։"
    ),
    "ru": (
        "Рыночная оценка на момент формирования отчёта; "
        "это не исторический бухгалтерский курс."
    ),
    "fr": (
        "Valorisation de marché au moment de la génération "
        "du rapport ; il ne s’agit pas d’un taux comptable historique."
    ),
}


_STALE = {
    "en": (
        "Market data is stale; the latest cached quote was used."
    ),
    "hy": (
        "Շուկայական տվյալները հնացած են․ կիրառվել է "
        "վերջին պահված փոխարժեքը։"
    ),
    "ru": (
        "Рыночные данные устарели; использована последняя "
        "сохранённая котировка."
    ),
    "fr": (
        "Les données de marché sont anciennes ; la dernière "
        "cotation mise en cache a été utilisée."
    ),
}


_STATE = {
    "en": {
        "fresh": "Fresh",
        "stale": "Stale",
        "identity": "No conversion",
    },
    "hy": {
        "fresh": "Թարմ",
        "stale": "Հնացած",
        "identity": "Փոխարկում չկա",
    },
    "ru": {
        "fresh": "Актуальные",
        "stale": "Устаревшие",
        "identity": "Без конвертации",
    },
    "fr": {
        "fresh": "À jour",
        "stale": "Anciennes",
        "identity": "Sans conversion",
    },
}


def _locale(value: str) -> str:
    normalized = str(value).strip().lower()
    return normalized if normalized in {"en", "hy", "ru", "fr"} else "en"


def _decimal(value: object, *, field: str) -> Decimal:
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError(
            f"invalid decimal value for {field}"
        ) from exc

    if not result.is_finite():
        raise ValueError(
            f"non-finite decimal value for {field}"
        )

    return result


def _money_minor_to_major(
    value: object,
    *,
    source_currency: str,
) -> Decimal:
    if isinstance(value, bool):
        raise ValueError("boolean is not a monetary amount")

    amount_minor = _decimal(
        value,
        field="minor amount",
    )

    scale = REPORT_SOURCE_CURRENCY_SCALE[
        source_currency
    ]

    return amount_minor / scale


def _quantize(
    value: Decimal,
    *,
    currency: str,
) -> Decimal:
    decimals = REPORT_DISPLAY_DECIMALS[currency]

    quantum = (
        Decimal("1")
        if decimals == 0
        else Decimal("1").scaleb(-decimals)
    )

    return value.quantize(
        quantum,
        rounding=ROUND_HALF_UP,
    )


def _format_decimal(
    value: Decimal,
    *,
    currency: str,
    locale: str,
) -> str:
    locale = _locale(locale)

    decimals = REPORT_DISPLAY_DECIMALS[
        currency
    ]

    rendered = format(
        value,
        f",.{decimals}f",
    )

    if locale in {"ru", "fr"}:
        rendered = (
            rendered
            .replace(",", "\u0000")
            .replace(".", ",")
            .replace("\u0000", "\u202f")
        )

    return rendered


def _format_money(
    value: Decimal,
    *,
    currency: str,
    locale: str,
) -> str:
    return (
        f"{_format_decimal(value, currency=currency, locale=locale)} "
        f"{currency}"
    )


def _project_minor(
    value: object,
    *,
    source_currency: str,
    display_currency: str,
    target_per_source: Decimal,
    locale: str,
) -> str:
    source_major = _money_minor_to_major(
        value,
        source_currency=source_currency,
    )

    projected = _quantize(
        source_major * target_per_source,
        currency=display_currency,
    )

    return _format_money(
        projected,
        currency=display_currency,
        locale=locale,
    )


def build_report_money_presentation(
    *,
    metrics: Mapping[str, Any],
    columns: Sequence[str],
    rows: Sequence[Sequence[Any]],
    locale: str,
    valuation_metadata: Mapping[str, Any] | None,
) -> dict[str, Any]:
    locale = _locale(locale)

    clean_metrics = {
        str(key): value
        for key, value in metrics.items()
        if str(key) not in {
            "__presentation__",
            "reporting_valuation",
        }
    }

    source_raw = clean_metrics.get("currency")

    source_currency = (
        str(source_raw).strip().upper()
        if source_raw is not None
        else ""
    )

    if source_currency not in REPORT_SOURCE_CURRENCY_SCALE:
        return {
            "mode": "not_applicable",
            "source_currency": None,
            "display_currency": None,
            "public_metrics": clean_metrics,
            "export_metrics": clean_metrics,
            "public_rows": tuple(
                tuple(row)
                for row in rows
            ),
            "export_rows": tuple(
                tuple(row)
                for row in rows
            ),
        }

    if valuation_metadata is None:
        display_currency = source_currency
        rate = Decimal("1")
        state = "identity"
        mode = "original"
        sources: tuple[str, ...] = ()
        timestamps: tuple[str, ...] = ()
        generated_at = None

    else:
        display_currency = str(
            valuation_metadata.get(
                "valuation_currency",
                "",
            )
        ).strip().upper()

        if display_currency not in REPORT_PRESENTATION_ASSETS:
            raise ValueError(
                "unsupported valuation presentation currency"
            )

        rate = _decimal(
            valuation_metadata.get(
                "target_per_source"
            ),
            field="target_per_source",
        )

        if rate <= 0:
            raise ValueError(
                "valuation presentation rate must be positive"
            )

        state = str(
            valuation_metadata.get(
                "state",
                "",
            )
        ).strip().lower()

        if state not in {
            "fresh",
            "stale",
            "identity",
        }:
            raise ValueError(
                "unsupported valuation presentation state"
            )

        mode = "valuation"

        raw_sources = valuation_metadata.get(
            "market_sources",
            (),
        )

        sources = tuple(
            str(value)
            for value in raw_sources
        )

        raw_timestamps = valuation_metadata.get(
            "source_timestamps",
            (),
        )

        timestamps = tuple(
            str(value)
            for value in raw_timestamps
        )

        generated_at = valuation_metadata.get(
            "market_generated_at"
        )

    public_metrics: dict[str, Any] = {}

    for key, value in clean_metrics.items():
        if key == "currency":
            public_metrics[key] = display_currency
            continue

        if key.endswith("_minor") and value is not None:
            public_metrics[key] = _project_minor(
                value,
                source_currency=source_currency,
                display_currency=display_currency,
                target_per_source=rate,
                locale=locale,
            )
            continue

        public_metrics[key] = value

    projected_rows: list[tuple[Any, ...]] = []

    for row in rows:
        projected: list[Any] = []

        for index, value in enumerate(row):
            key = (
                str(columns[index])
                if index < len(columns)
                else ""
            )

            if key.endswith("_minor") and value is not None:
                projected.append(
                    _project_minor(
                        value,
                        source_currency=source_currency,
                        display_currency=display_currency,
                        target_per_source=rate,
                        locale=locale,
                    )
                )
            else:
                projected.append(value)

        projected_rows.append(
            tuple(projected)
        )

    export_metrics = dict(public_metrics)

    if valuation_metadata is not None:
        export_metrics.update(
            {
                "source_currency":
                    source_currency,
                "reporting_currency":
                    display_currency,
                "valuation_state":
                    _STATE[locale].get(
                        state,
                        state,
                    ),
                "valuation_source":
                    ", ".join(sources)
                    if sources
                    else "identity",
                "valuation_timestamp":
                    str(generated_at or ""),
                "valuation_policy":
                    _POLICY[locale],
            }
        )

        if timestamps:
            export_metrics[
                "valuation_source_timestamp"
            ] = ", ".join(timestamps)

        if state == "stale":
            export_metrics[
                "valuation_warning"
            ] = _STALE[locale]

    return {
        "mode": mode,
        "source_currency": source_currency,
        "display_currency": display_currency,
        "target_per_source": format(
            rate,
            "f",
        ),
        "state": state,
        "public_metrics": public_metrics,
        "export_metrics": export_metrics,
        "public_rows": tuple(projected_rows),
        "export_rows": tuple(projected_rows),
    }
