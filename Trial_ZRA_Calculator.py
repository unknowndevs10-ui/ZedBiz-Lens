"""Command-line demonstration for the shared ZedBiz financial/tax engine.

This is an illustrative calculator, not a ZRA filing tool. It calls the same
deterministic engine used by the Agent Lab API so the app and script cannot
quietly drift into separate tax formulas.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ENGINE_PATH = Path(__file__).resolve().parent / "agent-lab" / "nlu-api"
sys.path.insert(0, str(ENGINE_PATH))
from calculations import calculate_financial_summary  # noqa: E402


def calculate_example(
    *, revenue: float = 42_000,
    cost_of_goods_sold: float = 27_300,
    operating_expenses: float = 6_500,
    turnover: float = 42_000,
    period: str = "monthly",
    fixed_costs: float | None = 6_500,
    variable_costs: float | None = 27_300,
) -> dict:
    return calculate_financial_summary(
        revenue=revenue,
        cost_of_goods_sold=cost_of_goods_sold,
        operating_expenses=operating_expenses,
        turnover=turnover,
        period=period,
        fixed_costs=fixed_costs,
        variable_costs=variable_costs,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run an illustrative ZedBiz financial and tax-readiness calculation.")
    parser.add_argument("--revenue", type=float, default=42_000)
    parser.add_argument("--cogs", type=float, default=27_300)
    parser.add_argument("--expenses", type=float, default=6_500)
    parser.add_argument("--turnover", type=float, default=42_000)
    parser.add_argument("--period", choices=("monthly", "annual"), default="monthly")
    parser.add_argument("--fixed-costs", type=float, default=6_500)
    parser.add_argument("--variable-costs", type=float, default=27_300)
    args = parser.parse_args()

    result = calculate_example(
        revenue=args.revenue,
        cost_of_goods_sold=args.cogs,
        operating_expenses=args.expenses,
        turnover=args.turnover,
        period=args.period,
        fixed_costs=args.fixed_costs,
        variable_costs=args.variable_costs,
    )
    financial = result["financial_summary"]
    tax = result["tax_demo"]
    turnover_tax = tax["turnover_tax"]
    vat = tax["vat_threshold_progress"]

    print("=== ZEDBIZ LENS FINANCIAL DEMO ===")
    print(f"Revenue: K{financial['revenue']:,.2f}")
    print(f"Cost of goods sold: K{financial['cost_of_goods_sold']:,.2f}")
    print(f"Gross profit: K{financial['gross_profit']:,.2f}")
    print(f"Operating expenses: K{financial['operating_expenses']:,.2f}")
    print(f"Net profit before tax: K{financial['net_profit_before_tax']:,.2f}")
    break_even = financial["break_even"]
    print("Break-even: not calculated (cost split not supplied)" if break_even["status"] != "calculated" else f"Break-even revenue: K{break_even['revenue']:,.2f}")
    print(f"Annual-equivalent turnover: K{turnover_tax['annual_equivalent_turnover']:,.2f}")
    for mode, option in turnover_tax["options"].items():
        amount = option["estimated_tax"]
        shown = "not estimated: above reference ceiling" if amount is None else f"K{amount:,.2f}"
        print(f"Turnover-tax scenario ({mode}): {shown}")
    print(f"VAT threshold progress indicator: {vat['progress_percent']:.2f}%")
    print("Selected tax base: none (Finance review required)")
    print("VAT payable: not calculated (supply and input VAT data required)")
    print("Illustrative synthetic-data demo only; not tax advice or a filing calculation.")


if __name__ == "__main__":
    main()
