from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Literal

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sklearn.metrics.pairwise import cosine_similarity
from calculations import calculate_financial_summary

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "artifacts" / "intent_pipeline.joblib"
METADATA_PATH = ROOT / "artifacts" / "metadata.json"
MODEL = None
METADATA: dict = {}

app = FastAPI(title="ZedBiz Lens NLU", version="0.1.0")
allowed_origins = [origin.strip() for origin in os.getenv(
    "ZEDBIZ_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def home() -> str:
    return """<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>ZedBiz NLU service</title><body style='font:16px Segoe UI,Arial,sans-serif;max-width:680px;margin:12vh auto;padding:24px;color:#1E2A2F;background:#F2F6F6'>
    <h1 style='color:#1F6F6B'>ZedBiz NLU service is running</h1><p>This is the local AI API, not the Agent Lab interface.</p>
    <p><a href='http://127.0.0.1:4177' style='color:#1F6F6B'>Open the Agent Lab</a></p>
    <p><a href='/docs' style='color:#1F6F6B'>View API documentation</a></p></body></html>"""


class InterpretRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    language: str = Field(default="en", max_length=12)


class FinancialCalculationRequest(BaseModel):
    revenue: float = Field(ge=0, le=1_000_000_000_000, allow_inf_nan=False)
    cost_of_goods_sold: float = Field(ge=0, le=1_000_000_000_000, allow_inf_nan=False)
    operating_expenses: float = Field(ge=0, le=1_000_000_000_000, allow_inf_nan=False)
    turnover: float = Field(ge=0, le=1_000_000_000_000, allow_inf_nan=False)
    period: Literal["monthly", "annual"]
    fixed_costs: float | None = Field(default=None, ge=0, le=1_000_000_000_000, allow_inf_nan=False)
    variable_costs: float | None = Field(default=None, ge=0, le=1_000_000_000_000, allow_inf_nan=False)


class TransactionDraft(BaseModel):
    type: Literal["sale", "expense"] | None = None
    amount: float | None = None
    currency: Literal["ZMW"] = "ZMW"
    description: str | None = None


class InterpretResponse(BaseModel):
    model_version: str | None
    training_data_status: str
    intent: Literal["sale", "expense", "summary", "unknown"]
    draft: TransactionDraft | None
    needs_clarification: bool
    needs_owner_confirmation: bool
    question: str | None
    review_reasons: list[str]


def load_model() -> None:
    global MODEL, METADATA
    if MODEL is None and MODEL_PATH.exists() and METADATA_PATH.exists():
        MODEL = joblib.load(MODEL_PATH)
        METADATA = json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def extract_amount(text: str) -> tuple[float | None, str | None]:
    marked = re.findall(r"(?:\bK\s*|\bZMW\s*)(\d[\d,]*(?:\.\d{1,2})?)|(\d[\d,]*(?:\.\d{1,2})?)\s*(?:kwacha|ZMW)\b", text, re.I)
    values = [float((left or right).replace(",", "")) for left, right in marked]
    values = [value for value in values if value > 0]
    if len(values) == 1:
        return values[0], None
    if len(values) > 1:
        return None, "I found more than one possible amount. Which amount should I use?"

    bare = [float(value.replace(",", "")) for value in re.findall(r"\b\d[\d,]*(?:\.\d{1,2})?\b", text)]
    if len(bare) == 1 and bare[0] > 0:
        return bare[0], None
    if len(bare) > 1:
        return None, "I found more than one number. Please repeat the amount, for example K250."
    return None, "What amount should I put in this draft?"


@app.get("/health")
def health() -> dict:
    load_model()
    return {
        "status": "ready" if MODEL is not None else "model_not_trained",
        "model_version": METADATA.get("model_version"),
        "training_data_status": METADATA.get("training_data", "not_available"),
        "validated_for_real_business_use": METADATA.get("validated_for_real_business_use", False),
    }


@app.post("/api/v1/calculations/financial-summary")
def financial_summary(request: FinancialCalculationRequest) -> dict:
    """Deterministic finance summary plus clearly labelled tax demo scenarios."""
    return calculate_financial_summary(
        revenue=request.revenue,
        cost_of_goods_sold=request.cost_of_goods_sold,
        operating_expenses=request.operating_expenses,
        turnover=request.turnover,
        period=request.period,
        fixed_costs=request.fixed_costs,
        variable_costs=request.variable_costs,
    )


@app.post("/api/v1/interpret", response_model=InterpretResponse)
def interpret(request: InterpretRequest) -> InterpretResponse:
    load_model()
    text = request.text.strip()
    if request.language.lower() not in {"en", "en-zm", "en-za"}:
        return InterpretResponse(
            model_version=METADATA.get("model_version"),
            training_data_status=METADATA.get("training_data", "unknown"),
            intent="unknown", draft=None, needs_clarification=True, needs_owner_confirmation=True,
            question="This demo has only been trained on synthetic English phrases. Please type an English example or use the demo mode.",
            review_reasons=["language_not_validated"],
        )
    if MODEL is None:
        return InterpretResponse(
            model_version=None,
            training_data_status="model_not_trained",
            intent="unknown",
            draft=None,
            needs_clarification=True,
            needs_owner_confirmation=True,
            question="The intent model is not trained yet. Please use demo mode or try again later.",
            review_reasons=["model_unavailable"],
        )

    intent = str(MODEL.predict([text])[0])
    reasons = ["synthetic_model_unvalidated"]
    scores = MODEL.decision_function([text])[0]
    score_values = sorted((float(value) for value in scores), reverse=True)
    margin = score_values[0] - score_values[1] if len(score_values) > 1 else 0.0
    features = MODEL.named_steps["features"]
    query_features = features.transform([text])
    reference_features = features.transform(METADATA.get("reference_phrases", []))
    similarity = float(cosine_similarity(query_features, reference_features).max()) if reference_features.shape[0] else 0.0
    if margin < 0.15:
        reasons.append("low_intent_margin")
    if similarity < 0.12:
        reasons.append("input_far_from_synthetic_examples")
    if margin < 0.15 or similarity < 0.12:
        return InterpretResponse(
            model_version=METADATA.get("model_version"), training_data_status=METADATA.get("training_data", "unknown"),
            intent="unknown", draft=None, needs_clarification=True, needs_owner_confirmation=True,
            question="I’m not sure I understood that. Is it a sale, an expense, or a request for your summary?",
            review_reasons=reasons,
        )
    if intent == "summary":
        return InterpretResponse(
            model_version=METADATA.get("model_version"), training_data_status=METADATA.get("training_data", "unknown"),
            intent="summary", draft=None, needs_clarification=False, needs_owner_confirmation=False,
            question=None, review_reasons=reasons,
        )

    if intent not in {"sale", "expense"}:
        return InterpretResponse(
            model_version=METADATA.get("model_version"), training_data_status=METADATA.get("training_data", "unknown"),
            intent="unknown", draft=None, needs_clarification=True, needs_owner_confirmation=True,
            question="I’m not sure what business task you mean. Is this a sale, an expense, or a summary request?",
            review_reasons=reasons + ["unsupported_or_uncertain_intent"],
        )

    amount, question = extract_amount(text)
    needs_clarification = amount is None
    if needs_clarification:
        reasons.append("amount_missing_or_ambiguous")
    return InterpretResponse(
        model_version=METADATA.get("model_version"), training_data_status=METADATA.get("training_data", "unknown"),
        intent=intent,
        draft=TransactionDraft(type=intent, amount=amount, description=text),
        needs_clarification=needs_clarification,
        needs_owner_confirmation=True,
        question=question,
        review_reasons=reasons,
    )
