"""Small, deterministic AI-adjacent rules usable without loading ML dependencies."""

import re
from datetime import date
from typing import Any


def parse_batch_text(text: str) -> dict[str, Any]:
    text = str(text or "").strip()[:1200]
    if re.search(r"\b(tax|vat|file|filing|return|registration|liable|deduct|submit)\b", text, re.I):
        return {"kind": "clarify", "drafts": [], "operations": [], "message": "I can organise records, but I do not decide tax liability or filing. Review the deterministic Tax Readiness view with Finance.", "review_reasons": ["tax_decision_out_of_scope"]}

    clauses = [part.strip() for part in re.split(r"[;\n]+|,(?=\s*[A-Za-z])|\.(?!\d)", text) if part.strip()]
    drafts: list[dict[str, Any]] = []
    operations: list[dict[str, Any]] = []
    unparsed: list[dict[str, str]] = []
    for clause in clauses:
        marked = re.findall(r"(?:\bK\s*|\bZMW\s*)(\d[\d,]*(?:\.\d{1,2})?)|(\d[\d,]*(?:\.\d{1,2})?)\s*(?:kwacha|ZMW)\b", clause, re.I)
        values = [float((left or right).replace(",", "")) for left, right in marked]
        values = [value for value in values if value > 0]
        if re.search(r"\b(cash count|cash counted|closing cash|cash close|counted cash)\b", clause, re.I):
            if len(values) == 1:
                operations.append({"type": "cash_count", "actual": values[0], "sourceText": clause, "explanation": "Cash count phrase and one explicit amount. This is not sales income."})
            else:
                unparsed.append({"text": clause, "reason": "Enter one clear cash count amount."})
            continue
        if len(values) != 1:
            if values:
                unparsed.append({"text": clause, "reason": "More than one amount found; split this into separate facts."})
            continue
        lower = clause.lower()
        income = bool(re.search(r"\b(sold|sale|sales|earned|received|nagulisa|nagulitsa|nagulisha|tengesa|watengesa|watenga|credit|ngongole)\b", lower))
        personal = bool(re.search(r"\b(personal transfer|owner withdrawal|personal use|family transfer)\b", lower))
        expense = bool(re.search(r"\b(transport|rent|fuel|fee|spent|paid|bought|purchase|stock|wage|electric|water|spoilage)\b", lower))
        if not (income or expense or personal):
            unparsed.append({"text": clause, "reason": "I found an amount but not whether it was a sale, expense or personal movement."})
            continue
        amount = values[0]
        tx_type = "owner_withdrawal" if personal else "income" if income else "expense"
        category = "Owner personal withdrawal" if personal else "Sales" if income else "Transport" if re.search(r"\btransport\b", lower) else "Stock purchases" if re.search(r"\b(stock|bought|purchase)\b", lower) else "Other expenses"
        quantity_match = re.search(r"\b(\d+(?:\.\d+)?)\s*(crates?|boxes?|bags?|units?|items?|pieces?|kg|kilograms?)\s*(?:ya|of|za)?\s*([a-z][a-z-]*)?", clause, re.I)
        item = quantity_match.group(3) if quantity_match else ""
        drafts.append({
            "kind": "transaction", "sourceText": clause,
            "draft": {"type": tx_type, "category": category, "description": clause[:80], "amount": amount,
                      "date": date.today().isoformat(), "paymentMethod": "credit" if re.search(r"\b(credit|ngongole)\b", lower) else "unspecified",
                      "itemName": item, "quantity": float(quantity_match.group(1)) if quantity_match else None,
                      "confidence": 0.62, "taxable": "unsure" if income else None,
                      "taxReason": "The parser does not decide tax treatment." if income else None},
            "confidence": 0.62,
            "explanation": f"Detected an explicit K{amount:g} and phrase evidence in '{clause[:60]}'. This remains a draft.",
            "reviewReasons": ["synthetic_phrase_rules", "human_confirmation_required"],
        })
    if not drafts and not operations:
        return {"kind": "clarify", "drafts": [], "operations": [], "unparsed": unparsed,
                "message": unparsed[0]["reason"] if unparsed else "Add an explicit Kwacha amount and a business action.",
                "review_reasons": ["no_reviewable_draft"]}
    return {"kind": "drafts", "drafts": drafts, "operations": operations, "unparsed": unparsed,
            "source": "fastapi-phrase-rules-v1", "needs_owner_confirmation": True,
            "notice": "Synthetic phrase rules only; no real trader speech validation. Nothing is confirmed automatically."}


def revenue_baseline(history: list[dict[str, Any]], horizon_days: int = 30, business_type: str = "other") -> dict[str, Any]:
    by_day: dict[date, float] = {}
    for point in history:
        try:
            day = date.fromisoformat(str(point.get("date", "")))
            revenue = float(point.get("revenue", 0))
        except (TypeError, ValueError):
            continue
        if revenue >= 0:
            by_day[day] = by_day.get(day, 0.0) + revenue
    days = sorted(by_day)[-90:]
    span = (days[-1] - days[0]).days + 1 if days else 0
    total = sum(by_day[day] for day in days)
    average = total / span if span else 0.0
    predicted = round(average * horizon_days, 2)
    uncertainty = 0.25 if span >= 30 else 0.4 if span >= 14 else 0.6
    return {
        "predicted_revenue": predicted,
        "confidence_low": round(predicted * (1 - uncertainty), 2),
        "confidence_high": round(predicted * (1 + uncertainty), 2),
        "growth_driver": f"Mean confirmed sales across {span} observed calendar days" if span else "Not enough confirmed sales history",
        "history_days": span,
        "source": "synthetic-baseline",
        "model_version": None,
        "business_type": business_type,
        "notice": "No XGBoost model is connected; this is an arithmetic baseline, not a learned forecast.",
    }

