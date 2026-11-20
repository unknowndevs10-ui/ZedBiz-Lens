#!/usr/bin/env python3
"""
zra_calculator.py - Financial & tax calculator based on Zambia Revenue Authority (ZRA) rules.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

RULES_FILENAME = "tax_rules.json"

# Search order for the rules file
RULES_SEARCH_PATHS = [
    Path.home() / "Desktop" / RULES_FILENAME,
    Path.home() / "OneDrive" / "Desktop" / RULES_FILENAME,
    Path(__file__).with_name(RULES_FILENAME),
]

DEFAULT_RULES = {
    "meta": {"currency": "ZMW", "tax_year": 2026},
    "turnover_tax": {
        "annual_ceiling": 5_000_000,
        "rate": 0.05,
        "nil_band_upper": 30_000,
        "monthly_nil_band_upper": 2_500,
        "default_mode": "excess_only",
    },
    "vat": {
        "standard_rate": 0.16,
        "registration_threshold_annual": 800_000,
    },
}


def load_rules(path: Optional[Path] = None) -> dict:
    if path and Path(path).is_file():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    for candidate in RULES_SEARCH_PATHS:
        if candidate.is_file():
            with open(candidate, encoding="utf-8") as f:
                return json.load(f)
    return DEFAULT_RULES


def gross_profit(revenue: float, cogs: float) -> float:
    return revenue - cogs


def net_profit(gross: float, operating_expenses: float, tax: float = 0.0) -> float:
    return gross - operating_expenses - tax


def margin_pct(profit: float, revenue: float) -> Optional[float]:
    return None if revenue == 0 else round(profit / revenue * 100, 2)


def break_even(fixed_costs: float, variable_costs: float, revenue: float) -> dict:
    if revenue <= 0:
        return {"error": "Revenue must be greater than zero for contribution margin calculation."}
    cm_ratio = (revenue - variable_costs) / revenue
    be_revenue = fixed_costs / cm_ratio if cm_ratio > 0 else None
    return {
        "contribution_margin_ratio_pct": round(cm_ratio * 100, 2),
        "break_even_revenue": round(be_revenue, 2) if be_revenue else None
    }


def turnover_tax(turnover: float, rules: dict, mode: str = "excess_only", period: str = "monthly") -> dict:
    tt = rules["turnover_tax"]
    ceiling = tt["annual_ceiling"]
    rate = tt["rate"]

    # Select monthly vs annual threshold
    if period == "monthly":
        nil_upper = tt.get("monthly_nil_band_upper", 2500)
    else:
        nil_upper = tt.get("nil_band_upper", 30000)

    if turnover > ceiling:
        return {"mode": mode, "turnover": turnover, "band": "Above ceiling", "regime": "income_tax",
                "turnover_tax": None}
    elif turnover <= nil_upper:
        return {"mode": mode, "turnover": turnover, "band": "Nil band", "regime": "turnover_tax", "taxable_amount": 0.0,
                "turnover_tax": 0.0}
    else:
        taxable = turnover - nil_upper if mode == "excess_only" else turnover
        tax = round(taxable * rate, 2)
        return {
            "mode": mode,
            "turnover": turnover,
            "band": "Turnover tax band",
            "regime": "turnover_tax",
            "taxable_amount": taxable,
            "turnover_tax": tax
        }


def vat_progress(turnover: float, rules: dict, period: str = "monthly") -> dict:
    vat = rules["vat"]
    annual_thr = vat["registration_threshold_annual"]

    # If input is monthly, annualise it to check annual threshold progress (e.g. 42k * 12 = 504k -> 63%)
    annual_equivalent = turnover * 12 if period == "monthly" else turnover
    pct = round(annual_equivalent / annual_thr * 100, 2)

    return {
        "tracked_turnover": turnover,
        "annual_equivalent": annual_equivalent,
        "annual_threshold": annual_thr,
        "progress_pct": pct,
        "status": "MANDATORY" if annual_equivalent > annual_thr else (
            "WARNING (80%+)" if pct >= 80 else "Below threshold")
    }


import unittest
from ZRA_calculator import gross_profit, net_profit, break_even, turnover_tax, vat_progress, load_rules

class TestZraCalculator(unittest.TestCase):
    
    def setUp(self):
        # Load the tax rules and set up the team's worked example inputs
        self.rules = load_rules()
        self.revenue = 42000.0
        self.cogs = 27300.0
        self.expenses = 6500.0
        self.fixed_costs = 6500.0

    def test_gross_profit(self):
        gp = gross_profit(self.revenue, self.cogs)
        self.assertEqual(gp, 14700.0)

    def test_net_profit(self):
        gp = gross_profit(self.revenue, self.cogs)
        np = net_profit(gp, self.expenses)
        self.assertEqual(np, 8200.0)

    def test_break_even(self):
        be = break_even(self.fixed_costs, self.cogs, self.revenue)
        self.assertEqual(round(be["break_even_revenue"]), 18571)

    def test_turnover_tax(self):
        tt_excess = turnover_tax(self.revenue, self.rules, mode="excess_only")
        tt_total = turnover_tax(self.revenue, self.rules, mode="total_turnover")
        self.assertEqual(tt_excess["turnover_tax"], 1975.0)
        self.assertEqual(tt_total["turnover_tax"], 2100.0)

    def test_vat_progress(self):
        vat = vat_progress(self.revenue, self.rules)
        self.assertEqual(vat["progress_pct"], 63.0)

if __name__ == "__main__":
    unittest.main()