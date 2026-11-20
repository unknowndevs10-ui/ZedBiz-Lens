# ZedBiz Lens — Agent Lab

A lightweight, AI-based language-understanding demo kept separate from the main app while its workflow is evaluated. The interface follows the ZedBiz palette: teal `#1F6F6B`, amber `#E0A84B`, pale surface `#F2F6F6`, dark ink `#1E2A2F`, and muted text `#4F5E64`.

## Run the AI mode

The AI layer is a small local scikit-learn intent classifier exposed by FastAPI. It is trained on the synthetic examples currently checked into `nlu-api/`; this demonstrates the full path but is not validated for real businesses.

**Terminal 1 — train and start the NLU API:**

```powershell
cd nlu-api
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python train.py
uvicorn app:app --host 127.0.0.1 --port 4176
```

**Terminal 2 — serve the UI and local proxy** from `agent-lab/`:

```powershell
node server.mjs
```

Open `http://127.0.0.1:4175`. When the NLU service is available, AI mode is offered. The API is local and uses no hosted AI API key. Stop both terminal processes when finished to free memory.

## What the AI does

- A word and character TF-IDF pipeline with a class-weighted linear SVM predicts sale, expense, or summary intent.
- Simple deterministic parsing extracts explicit numeric amounts. Multiple or missing amounts trigger a question instead of a guess.
- Sale and expense suggestions appear as editable drafts. The owner must confirm before the entry affects session totals.
- Model outputs identify their training status. The current model is trained on 36 synthetic phrases, and its random held-out result is only a plumbing check.
- Demo mode remains available as a fallback and comparison path.

## Boundaries and next work

- The current classifier does not understand all languages, calculate profit or tax, assign taxability, scan receipts, save to a permanent ledger, or connect to ZRA/Zamtel.
- Recorded sales minus expenses are cash movement for this temporary session, not gross profit, taxable profit, or bank balance.
- Developer B's transaction classifier remains a separate downstream component and is not implemented by this AI service.
- Before any integration claim, replace the synthetic phrases with reviewed Zambian examples, split evaluation by speaker/business, report per-intent performance, and measure CPU latency and memory. Unsupported and low-margin input must keep asking for clarification.

## Voice and privacy limits

Microphone capture uses the browser's Web Speech Recognition implementation where available. Browser support varies and recognition may rely on a browser-managed network service. Spoken replies use browser speech synthesis. The NLU request itself stays on this computer; voice recognition may process audio outside the demo. English is the only language currently represented in the synthetic set; Bemba and Nyanja are not validated.

