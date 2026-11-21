"""Rule-driven ZedBiz tax-readiness calculator.

Uses confirmed ledger records and the root tax_rules.json reference file. This
is deterministic arithmetic for an illustrative demo, not a ZRA filing tool.
"""
from __future__ import annotations

import argparse
import json
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

RULES = json.loads((Path(__file__).resolve().parent / "tax_rules.json").read_text(encoding="utf-8"))
CENT = Decimal("0.01")


def _d(value: Any) -> Decimal:
    try:
        result = Decimal(str(value or 0))
        return result if result.is_finite() else Decimal(0)
    except Exception:
        return Decimal(0)


def _money(value: Any) -> Decimal:
    return max(Decimal(0), _d(value))


def _r(value: Decimal) -> float:
    return float(value.quantize(CENT, rounding=ROUND_HALF_UP))


def _norm(value: Any) -> str:
    return "_".join(str(value or "").lower().replace("-", " ").split())


def _progressive_tax(profit: Decimal) -> Decimal:
    remaining = max(Decimal(0), profit)
    floor = Decimal(0)
    tax = Decimal(0)
    for band in RULES["income_tax"]["individual_annual_bands"]:
        ceiling = Decimal(str(band["up_to"])) if band["up_to"] is not None else None
        taxable = remaining if ceiling is None else min(remaining, max(Decimal(0), ceiling - floor))
        tax += taxable * Decimal(str(band["rate"]))
        remaining -= taxable
        if ceiling is not None:
            floor = ceiling
        if remaining <= 0:
            break
    return tax


def _turnover_eligibility(profile: dict[str, Any], annual_turnover: Decimal) -> dict[str, Any]:
    legal_form = _norm(profile.get("legalForm", profile.get("legal_form")))
    activity = _norm(profile.get("taxActivity", profile.get("tax_activity")) or profile.get("businessType"))
    excluded_legal = {_norm(x) for x in RULES["turnover_tax"]["eligibility"]["excluded_legal_forms"]}
    excluded_activity = [_norm(x) for x in RULES["turnover_tax"]["eligibility"]["excluded_activities"]]
    reasons: list[str] = []
    if not legal_form:
        reasons.append("Legal form needs confirmation.")
    if not activity:
        reasons.append("Business activity needs confirmation.")
    if activity == "other":
        reasons.append("Confirm whether this activity is covered by the turnover-tax regime.")
    if legal_form in excluded_legal:
        reasons.append("Partnerships are excluded from turnover tax under the reference rules.")
    if any(term in activity for term in ("consultancy", "management_consultancy")):
        reasons.append("Consultancy income is excluded from turnover tax.")
    if "mining" in activity:
        reasons.append("Mining activity requires a separate eligibility review.")
    if "public_service_vehicle_under_50" in activity:
        reasons.append("Public service vehicle activity needs a separate tax review.")
    ceiling = Decimal(str(RULES["turnover_tax"]["annual_ceiling"]))
    if annual_turnover > ceiling:
        reasons.append("Annualized turnover is above the K5,000,000 ceiling.")
    vat_status = profile.get("vatStatus", profile.get("vat_status"))
    vat_route = profile.get("vatRegistrationType", profile.get("vat_registration_type"))
    if vat_status == "yes" and vat_route != "voluntary":
        reasons.append("VAT registration type needs review. ZRA allows voluntary VAT registration to coexist with turnover tax, but statutory VAT status should be confirmed.")
    complete = bool(legal_form and activity)
    excluded = legal_form in excluded_legal or any(term in activity for term in ("consultancy", "management_consultancy", "mining", "public_service_vehicle_under_50")) or annual_turnover > ceiling
    return {"status": "needs-profile" if not complete else "review-required" if excluded or reasons else "illustrative-eligible", "reasons": reasons, "incomeTaxRegimeRequired": excluded}


def calculate_tax_readiness(transactions: list[dict[str, Any]], profile: dict[str, Any] | None = None, today: date | None = None) -> dict[str, Any]:
    """Calculate tax-readiness estimates from confirmed entries in the last 90 days."""
    profile = profile or {}
    end = today or date.today()
    start = end.fromordinal(end.toordinal() - 89)
    period_rows = [row for row in transactions if row.get("status") == "confirmed" and str(row.get("date", ""))[:10] >= start.isoformat() and str(row.get("date", ""))[:10] <= end.isoformat()]
    income = [row for row in period_rows if row.get("type") == "income"]
    expenses = [row for row in period_rows if row.get("type") == "expense" and row.get("category") != "Owner personal withdrawal"]
    cogs_categories = set(RULES["accounting"]["cogs_categories"])
    cogs = sum((_money(row.get("amount")) for row in expenses if row.get("category") in cogs_categories), Decimal(0))
    operating = [row for row in expenses if row.get("category") not in cogs_categories]
    allowable = sum((_money(row.get("amount")) for row in operating if row.get("taxDeductible", row.get("tax_deductible")) is True), Decimal(0))
    unreviewed = sum(1 for row in operating if row.get("taxDeductible", row.get("tax_deductible")) not in (True, False))
    sales = sum((_money(row.get("amount")) for row in income), Decimal(0))
    gross = sales - cogs
    all_operating = sum((_money(row.get("amount")) for row in operating), Decimal(0))
    net = gross - all_operating
    annualizer = Decimal(365) / Decimal(90)
    annual_turnover = sales * annualizer
    period_standard = sum((_money(row.get("amount")) for row in income if row.get("vatTreatment", row.get("vat_treatment")) == "standard_rated"), Decimal(0))
    annual_standard = period_standard * annualizer

    tot_rules = RULES["turnover_tax"]
    nil_band = Decimal(str(tot_rules["nil_band_upper"]))
    ceiling = Decimal(str(tot_rules["annual_ceiling"]))
    rate = Decimal(str(tot_rules["rate"]))
    excess_tax = max(Decimal(0), annual_turnover - nil_band) * rate
    full_tax = annual_turnover * rate if annual_turnover > nil_band else Decimal(0)
    eligibility = _turnover_eligibility(profile, annual_turnover)

    vat_rules = RULES["vat"]
    vat_rate = Decimal(str(vat_rules["standard_rate"]))
    threshold = Decimal(str(vat_rules["registration_threshold_annual"]))
    progress = annual_standard / threshold * 100 if threshold else Decimal(0)
    vat_registered = profile.get("vatStatus", profile.get("vat_status")) == "yes"
    vat_triggered = progress >= 100
    tagged_sales = [row for row in income if row.get("vatTreatment", row.get("vat_treatment")) == "standard_rated"]
    output_vat = sum((_money(row.get("amount")) * vat_rate if row.get("amountIncludesVat", row.get("amount_includes_vat", True)) is False else _money(row.get("amount")) * vat_rate / (1 + vat_rate) for row in tagged_sales), Decimal(0))
    valid_inputs = []
    for row in expenses:
        if not (row.get("smartInvoiceValid", row.get("smart_invoice_valid")) and row.get("supplierTpinVerified", row.get("supplier_tpin_verified")) and _money(row.get("inputVatAmount", row.get("input_vat_amount"))) > 0):
            continue
        try:
            invoice_date = date.fromisoformat(str(row.get("inputInvoiceDate", row.get("input_invoice_date")) or row.get("date"))[:10])
        except ValueError:
            continue
        age = (end - invoice_date).days
        if 0 <= age <= int(vat_rules["input_invoice_validity_days"]):
            valid_inputs.append(row)
    input_vat = sum((_money(row.get("inputVatAmount", row.get("input_vat_amount"))) for row in valid_inputs), Decimal(0))

    annual_cogs = cogs * annualizer
    annual_allowable = allowable * annualizer
    taxable_profit = max(Decimal(0), annual_turnover - annual_cogs - annual_allowable)
    legal_form = _norm(profile.get("legalForm", profile.get("legal_form")))
    activity = _norm(profile.get("taxActivity", profile.get("tax_activity")) or profile.get("businessType"))
    income_tax: Decimal | None = None
    mat: Decimal | None = None
    rate_label = "Complete the tax profile to unlock"
    if legal_form == "limited_company":
        corporate_rate = Decimal(str(RULES["income_tax"]["agriculture_corporate_rate"] if "agric" in activity else RULES["income_tax"]["corporate_rate"]))
        income_tax = taxable_profit * corporate_rate
        if eligibility["incomeTaxRegimeRequired"]:
            mat = annual_turnover * Decimal(str(RULES["income_tax"]["minimum_alternative_tax_rate"]))
            income_tax = max(income_tax, mat)
        rate_label = f"{corporate_rate * 100}% corporate" + (" agriculture" if "agric" in activity else "") + (" scenario; turnover-tax status needs confirmation" if mat is None else "; includes MAT floor check")
    elif legal_form in {"sole_trader", "registered_business_name"}:
        income_tax = _progressive_tax(taxable_profit)
        rate_label = "Progressive individual schedule (0%-37%)"
    elif legal_form == "partnership":
        rate_label = "Partner allocation needs Finance review"

    vat_payable = output_vat - input_vat
    return {
        "taxYear": RULES["meta"]["tax_year"],
        "sourceUrl": "https://www.zra.org.zm/tax-information/",
        "disclaimer": "Illustrative estimates only. Tax treatment depends on current law and verified records. ZedBiz Lens does not file returns or connect to ZRA systems.",
        "basis": {"start": start.isoformat(), "end": end.isoformat(), "days": 90, "transactionCount": len(period_rows)},
        "accounting": {"totalSales": _r(sales), "cogs": _r(cogs), "allowableOperatingExpenses": _r(allowable), "unreviewedExpenseCount": unreviewed, "grossProfit": _r(gross), "netProfit": _r(net), "annualizedTaxableProfit": _r(taxable_profit), "ownerWithdrawalsExcluded": sum(1 for row in period_rows if row.get("type") == "owner_withdrawal" or row.get("category") == "Owner personal withdrawal")},
        "turnover": {"annualized": _r(annual_turnover), "excessOnly": _r(excess_tax), "fullTurnover": _r(full_tax), "ceiling": float(ceiling), "nilBand": float(nil_band), "rate": float(rate), "eligibility": eligibility},
        "vat": {"annualizedStandardRated": _r(annual_standard), "periodStandardRated": _r(period_standard), "periodDays": 90, "threshold": float(threshold), "quarterlyThreshold": float(vat_rules["registration_threshold_quarterly"]), "progressPercent": min(100.0, _r(progress)), "actualProgressPercent": _r(progress), "registered": vat_registered, "triggered": vat_triggered, "shouldEstimate": vat_registered or vat_triggered, "outputVat": _r(output_vat), "inputVat": _r(input_vat), "inputInvoiceCount": len(valid_inputs), "vatPayableIllustration": _r(vat_payable), "standardRate": float(vat_rate)},
        "incomeTax": {"annualizedTaxableProfit": _r(taxable_profit), "estimatedTax": _r(income_tax) if income_tax is not None else None, "rateLabel": rate_label, "minimumAlternativeTax": _r(mat) if mat is not None else None, "deductibleExpenses": _r(annual_cogs + annual_allowable), "unreviewedExpenseCount": unreviewed},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the deterministic ZedBiz tax-readiness demo.")
    parser.add_argument("--sales", type=float, default=42_000, help="Confirmed sales for the 90-day demo window")
    parser.add_argument("--stock-costs", type=float, default=27_300, help="Confirmed COGS for the 90-day demo window")
    parser.add_argument("--operating-costs", type=float, default=6_500, help="Allowable operating expenses for the 90-day demo window")
    parser.add_argument("--legal-form", choices=("sole_trader", "registered_business_name", "limited_company", "partnership"), default="sole_trader")
    parser.add_argument("--activity", choices=("retail_trading", "agriculture", "services", "consultancy", "other"), default="retail_trading")
    args = parser.parse_args()
    today = date.today()
    rows = [
        {"id": "demo-sale", "status": "confirmed", "type": "income", "category": "Sales", "amount": args.sales, "date": today.isoformat(), "vatTreatment": "standard_rated"},
        {"id": "demo-stock", "status": "confirmed", "type": "expense", "category": "Stock purchases", "amount": args.stock_costs, "date": today.isoformat()},
        {"id": "demo-operating", "status": "confirmed", "type": "expense", "category": "Rent", "amount": args.operating_costs, "taxDeductible": True, "date": today.isoformat()},
    ]
    result = calculate_tax_readiness(rows, {"legalForm": args.legal_form, "taxActivity": args.activity, "vatStatus": "no"}, today)
    print(json.dumps(result, indent=2))
    print("Illustrative only: not tax advice and not a ZRA filing calculation.")


if __name__ == "__main__":
    main()

