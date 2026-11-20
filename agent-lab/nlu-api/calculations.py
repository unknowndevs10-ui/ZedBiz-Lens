"""Deterministic financial and illustrative Zambian tax calculations.

This module is intentionally separate from the NLU classifier. It consumes
structured, owner-reviewed values; it does not infer tax treatment from text.
Tax figures are demo estimates pending Finance review.
"""
from __future__ import annotations

import json
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Literal

RULES_PATH = Path(__file__).resolve().parents[2] / "tax_rules.json"


def load_tax_rules(path: Path = RULES_PATH) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        source = json.load(handle)
    # Normalize the shared Dev B rule file once so the calculator and UI use
    # the same approved reference values and tax-base labels.
    source_tt = source["turnover_tax"]
    source_vat = source["vat"]
    rules = {
        "meta": {
            **source.get("meta", {}),
            "status": "demo_pending_finance_validation",
        },
        "turnover_tax": {
            "annual_ceiling": source_tt["annual_ceiling"],
            "rate": source_tt["rate"],
            "nil_band_annual": source_tt["nil_band_upper"],
            "nil_band_monthly": source_tt["nil_band_upper"] / 12,
            "modes": list(source_tt["calculation_modes"]),
        },
        "vat": {
            "standard_rate": source_vat["standard_rate"],
            "registration_threshold_annual": source_vat["registration_threshold_annual"],
            "voluntary_registration_floor_annual": source_vat["voluntary_registration_floor"],
        },
    }
    # Fail closed if a required assumption is missing or malformed.
    tt = rules["turnover_tax"]
    vat = rules["vat"]
    required_positive = [
        tt["annual_ceiling"], tt["rate"], tt["nil_band_annual"],
        tt["nil_band_monthly"], vat["standard_rate"],
        vat["registration_threshold_annual"],
    ]
    if any(not isinstance(value, (int, float)) or value < 0 for value in required_positive):
        raise ValueError("Tax rules must contain non-negative numeric assumptions.")
    if set(tt["modes"]) != {"excess_only", "total_turnover"}:
        raise ValueError("Tax rules must list both supported turnover tax modes.")
    return rules


def _decimal(value: float | int) -> Decimal:
    return Decimal(str(value))


def _round(value: Decimal | float | int) -> float:
    return float(_decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _turnover_tax_option(turnover: Decimal, annual_equivalent: Decimal,
                         period: Literal["monthly", "annual"], mode: str,
                         rules: dict[str, Any]) -> dict[str, Any]:
    tt = rules["turnover_tax"]
    nil_band = tt["nil_band_monthly"] if period == "monthly" else tt["nil_band_annual"]
    if annual_equivalent > tt["annual_ceiling"]:
        return {
            "mode": mode,
            "status": "above_turnover_tax_ceiling",
            "eligible_under_demo_threshold": False,
            "taxable_amount": None,
            "estimated_tax": None,
        }
    nil_band_amount = _decimal(nil_band)
    taxable = max(Decimal("0"), turnover - nil_band_amount) if mode == "excess_only" else (turnover if turnover > nil_band_amount else Decimal("0"))
    return {
        "mode": mode,
        "status": "within_demo_turnover_tax_ceiling",
        "eligible_under_demo_threshold": True,
        "nil_band": nil_band,
        "rate": float(tt["rate"]),
        "taxable_amount": _round(taxable),
        "estimated_tax": _round(taxable * _decimal(tt["rate"])),
    }


def calculate_financial_summary(
    *, revenue: float, cost_of_goods_sold: float, operating_expenses: float,
    turnover: float, period: Literal["monthly", "annual"],
    fixed_costs: float | None = None, variable_costs: float | None = None,
    rules: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Calculate business summaries and illustrative tax scenarios.

    `net_profit_before_tax` is revenue less COGS and operating expenses.
    Break-even is returned only when fixed and variable costs are explicitly
    supplied; the function does not guess their split from ledger categories.
    """
    rules = rules or load_tax_rules()
    revenue_d = _decimal(revenue)
    cogs_d = _decimal(cost_of_goods_sold)
    operating_d = _decimal(operating_expenses)
    turnover_d = _decimal(turnover)
    fixed_d = _decimal(fixed_costs) if fixed_costs is not None else None
    variable_d = _decimal(variable_costs) if variable_costs is not None else None
    gross = revenue_d - cogs_d
    net_before_tax = gross - operating_d
    margin_ratio = ((revenue_d - variable_d) / revenue_d) if revenue_d > 0 and variable_d is not None else None
    if fixed_costs is None or variable_costs is None:
        break_even_result = {"status": "not_calculated", "revenue": None}
    elif revenue_d <= 0:
        break_even_result = {"status": "requires_positive_revenue", "revenue": None}
    elif margin_ratio is None or margin_ratio <= 0:
        break_even_result = {"status": "no_positive_contribution_margin", "revenue": None}
    else:
        break_even_result = {
            "status": "calculated",
            "contribution_margin_percent": _round(margin_ratio * 100),
            "revenue": _round(fixed_d / margin_ratio),
        }

    annual_turnover = turnover_d * 12 if period == "monthly" else turnover_d
    vat_rules = rules["vat"]
    vat_threshold = vat_rules["registration_threshold_annual"]
    tt_options = {
            mode: _turnover_tax_option(turnover_d, annual_turnover, period, mode, rules)
        for mode in rules["turnover_tax"]["modes"]
    }
    return {
        "currency": rules["meta"].get("currency", "ZMW"),
        "financial_summary": {
            "revenue": _round(revenue_d),
            "cost_of_goods_sold": _round(cogs_d),
            "gross_profit": _round(gross),
            "gross_margin_percent": _round(gross / revenue_d * 100) if revenue_d > 0 else None,
            "operating_expenses": _round(operating_d),
            "net_profit_before_tax": _round(net_before_tax),
            "net_margin_before_tax_percent": _round(net_before_tax / revenue_d * 100) if revenue_d > 0 else None,
            "break_even": break_even_result,
        },
        "tax_demo": {
            "status": rules["meta"].get("status", "demo_pending_finance_validation"),
            "tax_year": rules["meta"].get("tax_year"),
            "turnover_tax": {
                "period": period,
                "input_turnover": _round(turnover_d),
                "annual_equivalent_turnover": _round(annual_turnover),
                "options": tt_options,
                "selected_mode": None,
                "requires_finance_decision_on_taxable_base": True,
            },
            "vat_threshold_progress": {
                "annual_equivalent_turnover": _round(annual_turnover),
                "annual_registration_threshold": vat_threshold,
                "progress_percent": _round(annual_turnover / _decimal(vat_threshold) * 100),
                "at_or_above_demo_threshold": annual_turnover >= vat_threshold,
                "standard_rate_assumption": vat_rules["standard_rate"],
                "vat_payable": None,
                "vat_payable_note": "Not calculated: taxable supply types, output VAT and allowable input VAT are required.",
            },
            "disclaimer": rules["meta"].get("disclaimer", "Illustrative demonstration only; not tax advice or a filing calculation."),
        },
    }

