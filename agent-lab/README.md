# ZedBiz Lens — Agent Lab

A lightweight prototype for developing the language and interaction layer independently from the main app. The calm interface follows the ZedBiz palette: teal `#1F6F6B`, amber `#E0A84B`, pale surface `#F2F6F6`, dark ink `#1E2A2F`, and muted text `#4F5E64`.

## Run the local-model build

Requirements: Node.js 18+ and [Ollama](https://ollama.com/download) installed on this computer. Ollama is expected at `http://127.0.0.1:11434` by default.

1. Download the default local model once (this requires an internet connection and local disk space):

   ```bash
   ollama pull qwen3.5:2b
   ```

2. Make sure Ollama is running, then start the Agent Lab server from this folder:

   ```bash
   node server.mjs
   ```

3. Open `http://127.0.0.1:4175`. The header reports **LOCAL AI** when the selected model is installed and reachable. Select **DEMO MODE** to return to the synthetic phrase matcher.

The default model can be changed with `ZEDBIZ_MODEL` before starting the server. The Ollama URL can be changed with `OLLAMA_URL`. For example, in PowerShell:

```powershell
$env:ZEDBIZ_MODEL = 'qwen3.5:4b'
node server.mjs
```

The server binds to `127.0.0.1` only. The browser sends text to this local server, which calls Ollama on this same computer. This build does not call a paid hosted AI API and needs no AI API key. A model must still be downloaded to enable Local AI. If no model is installed or Ollama is stopped, the UI remains usable in demo phrase mode.

## What the local language agent does

- Interprets a sale, expense, or summary request using the local model, rather than only matching a short list of example phrases.
- Requests a missing amount or asks for clarification when the model cannot safely form a draft.
- Returns a constrained structured response and shows sale/expense drafts for the owner to correct and confirm.
- Does not calculate tax, classify taxability, infer profit, save a permanent ledger, scan receipts, or connect to ZRA/Zamtel.
- Leaves a clear seam for the separate future transaction-intelligence layer, pending Developer B's findings.

The model is a language helper, not a source of truth. Its output can be wrong. A person's confirmation remains required. The current total is confirmed sales minus confirmed expenses; it is not gross profit, taxable profit, or bank balance.

## Demo mode

The synthetic phrase matcher is retained as a fallback and comparison mode. It handles a narrow set of English sale, expense, and summary examples, including some spoken English number words. Its displayed match strength is a heuristic—not model confidence and not measured accuracy.

## Voice and privacy limits

Microphone capture uses the browser's Web Speech Recognition implementation where available. Browser support varies and recognition may rely on a browser-managed network service. Spoken replies use browser speech synthesis and installed voices. The Ollama language-model request itself stays on the local computer, but browser speech recognition may process audio outside the demo. Type instead of speaking if that is unsuitable.

The prototype supports only the English interaction patterns currently evaluated. It does not claim reliable Bemba, Nyanja, or other local-language support. Test local languages with fluent speakers before making a support claim. No data is persisted by the demo after the page closes.

## Architecture direction

1. **Language/interaction layer:** text or speech → clarification → normalized draft → owner confirmation.
2. **Transaction intelligence layer:** later, pass structured transaction features to the classifier selected with Developer B. XGBoost is a proposal, not yet a validated decision.
3. **Deterministic calculation layer:** approved business and tax formulas calculate results from explicit inputs. Neither model should invent or calculate tax amounts.

Agree and version the interface before integrating these pieces into the main app. Model classification scores need evaluation and uncertainty handling; they must not silently become tax decisions.

