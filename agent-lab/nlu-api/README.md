# ZedBiz NLU API (synthetic baseline)

This is the first **AI-based** intent-classification service for the Agent Lab. It trains a small scikit-learn model on word and character TF-IDF features and a class-weighted linear SVM. The code uses the current synthetic sale, expense, and summary phrases only. It is a plumbing baseline, not a validated model for Zambian traders.

## Setup and run

From this folder, using Python 3.11 or newer:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python train.py
uvicorn app:app --host 127.0.0.1 --port 4176
```

Open `http://127.0.0.1:4176/docs` for the API contract. `GET /health` reports whether a model was trained. `POST /api/v1/interpret` validates a short text and returns a bounded intent, optional draft, clarification flag, and review reasons.

## Deterministic finance calculation layer

`POST /api/v1/calculations/financial-summary` accepts owner-reviewed numeric values and returns gross profit, net profit before tax, margins, an optional break-even estimate, turnover-tax scenarios, and VAT-threshold progress. It is separate from the NLU classifier: machine learning can help interpret a request, while this endpoint performs explicit arithmetic over structured inputs.

Example request:

```json
{
  "revenue": 42000,
  "cost_of_goods_sold": 27300,
  "operating_expenses": 6500,
  "turnover": 42000,
  "period": "monthly",
  "fixed_costs": 6500,
  "variable_costs": 27300
}
```

Tax assumptions are loaded from the repository-root `tax_rules.json`, shared with the React tax-readiness screen. The response intentionally shows both `excess_only` and `total_turnover` turnover-tax interpretations and leaves `selected_mode` unset pending Finance validation. VAT payable is not calculated because the demo does not yet classify taxable, zero-rated, exempt, or input-tax records. All tax outputs are illustrative and must not be used for filing.

## Safety and evaluation

- Model scores are not presented as confidence. This first synthetic model always includes `synthetic_model_unvalidated` in review reasons.
- The amount parser accepts explicit numeric amounts only. Missing or multiple amounts trigger a question; no model guesses the value.
- Sale/expense drafts always require owner confirmation. Summary values must come from the app's confirmed ledger, not this API.
- The NLU classifier does not assign taxability or calculate tax. The separate calculation endpoint performs deterministic arithmetic over structured owner-reviewed inputs; its ZRA-related outputs use demo assumptions pending Finance validation.
- Training prints a random held-out synthetic score to verify the pipeline only. It is not a real-world performance claim. Replace the dataset with reviewed Zambian phrases and use a speaker/business-separated test before evaluating for integration.
- The API loads a tiny local model artifact and performs no cloud calls. Stop Uvicorn when not using the demo to keep background RAM use low.

