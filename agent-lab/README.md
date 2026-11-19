# ZedBiz Lens — Agent Lab

A lightweight, voice-first demo for exploring ZedBiz's assistant workflow separately from the main app, before integration. The interface follows the app palette: teal `#1F6F6B`, amber `#E0A84B`, pale surface `#F2F6F6`, dark ink `#1E2A2F`, and muted text `#4F5E64`.

## Run locally

Serve this folder on localhost so the browser can grant microphone access:

```bash
python -m http.server 4173 --directory agent-lab
```

Then open `http://localhost:4173`. If you are already in this folder, use `python -m http.server 4173` instead.

## Try it

- Type a business note, tap the microphone and speak, or select a short synthetic example.
- The local phrase matcher compares the note to examples in `synthetic-phrases.js` and suggests a sale, expense, or summary request.
- It extracts a numeric amount (including common spoken English number words), then shows a draft for review. You can correct the transaction type and amount before confirming.
- The assistant speaks its response using the browser's speech synthesis when **Voice replies** is on. Typed replies remain available if voice recognition is unavailable.
- Confirmed demo entries update the small session summary. They disappear when the page closes or is refreshed.

## Voice and privacy limits

No ZedBiz AI API, model API key, server, or external account is used. Text classification and phrase matching run locally in the browser; the training examples are synthetic and the match strength is a heuristic, not a probability or a measure of real-world accuracy.

Voice capture uses the browser's Web Speech Recognition implementation, which varies by browser and may require microphone permission and a network connection or browser-managed speech service. ZedBiz does not receive the audio. Spoken responses use the browser's speech synthesis and installed voices. For a voice failure, type the same note instead. The prototype currently evaluates English phrases only; it does not claim Nyanja, Bemba, or other local-language support.

## Boundaries

- Three intent families only: sales, expenses and business-summary requests. Unrecognized or ambiguous phrases prompt a clarification rather than being silently recorded.
- A person must confirm a proposed record. The amount and transaction type can be corrected first.
- Data exists in browser memory only. There is no persistent ledger, tax calculator, profit calculation, receipt scan, external messaging, ZRA/Zamtel integration, or connection to the React app.
- The totals show recorded sales minus recorded expenses. They are not gross profit, taxable profit, or a bank balance; stock cost and inventory are not inferred.
- Developer B's transaction-classification work remains open. This experiment provides a place to understand the user interaction and can be compared against an agreed agent interface later.

## Future two-layer direction (not implemented here)

1. **Language and interaction layer:** receive speech or text, interpret the owner's wording, ask for missing details, and prepare a normalized draft transaction.
2. **Transaction intelligence layer:** later, pass the confirmed structured transaction features to Developer B's XGBoost classifier for its category/taxability prediction and feedback. The agent can explain that result to the owner and request review when it is uncertain.

The layers should exchange a documented structured contract. The current synthetic phrase matcher does not call XGBoost, train a model, or represent Developer B's unfinished findings. Deterministic financial and tax calculations remain a separate, rules-based capability; the classifier's output should not itself decide or calculate a tax liability.

## Extending the synthetic examples

Add reviewed, synthetic paraphrases to the relevant `examples` list and meaningful intent words to `anchors` in `synthetic-phrases.js`. Then try known, ambiguous and unrelated phrases. Avoid calling match strength a model confidence, and do not treat synthetic phrases as evidence of language coverage with real business owners.

