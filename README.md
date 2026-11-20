# ZedBiz Lens

**UNKNOWNDEVs · Zamtel × ZRA Innovation Challenge · Intelligent Customer and Business Ecosystem**

ZedBiz Lens is a synthetic-data prototype for small and informal businesses in Zambia. It brings everyday records, clear business summaries and tax-readiness indicators into one calm workspace. The AI layer helps turn short notes into reviewable drafts and routes supported requests to deterministic business tools.

> **Demo only.** All seeded businesses and transactions are fictional. Tax scenarios use reference assumptions in `tax_rules.json`; they are not tax advice, an eligibility decision, or a filing calculation. Finance/ZRA must confirm the treatment before real use.

## Run the web demo

Requires Node.js 18 or newer.

```powershell
npm install
npm run dev
```

Open the local Vite URL. Choose **Open demo workspace**. The synthetic workspace stores changes in this browser and does not require an account or API key.

```powershell
npm test
npm run build
npm run preview
```

The test suite checks the local intent baseline. The calculator tests are in `agent-lab/nlu-api/tests` and `tests`.

## What the prototype does

- **Record keeping:** generate 120 days of deterministic synthetic activity for a mini-mart, hair studio and market stall. Add a note; review, edit, confirm or reject the resulting draft.
- **AI Agent Lab:** a small synthetic intent classifier recognizes sale, expense, summary or unsupported requests. It can prepare a sale/expense draft or call the confirmed-record summary tool. A possible duplicate is held for review.
- **Voice:** browser speech recognition and speech synthesis are optional. Voice recognition is English-only in this demo and may use the browser's speech service. Typing works without it.
- **Dashboard:** totals, trend charts, expense breakdown, performance comparison and recent records update from confirmed entries.
- **Tax readiness:** the app shows two turnover-tax scenarios and VAT threshold progress. It does not select a tax base, calculate income-tax liability or calculate VAT payable.
- **Reports:** download synthetic financial and illustrative tax-position PDFs from confirmed records.
- **Demo session:** a two-hour, browser-tab session makes the public prototype flow coherent. This is not authentication or an authorization boundary.

## AI and calculation design

The default app runs an offline Naive Bayes intent baseline over 44 fictional English phrases. It uses no model API key. This is a wiring prototype, not a dependable business classifier. Accuracy has not been validated on real operators, accents, noisy speech or local languages. Low-confidence and unsupported requests are held for clarification. An agent-proposed record remains pending until a person confirms it.

The local Agent Lab includes Dev A's optional FastAPI/SVM baseline. Set `VITE_AGENT_API_URL` in `.env.local` to use that service instead of the browser baseline. It uses a small synthetic dataset and the training report in `agent-lab/nlu-api/artifacts/metadata.json`; its reported synthetic test score is not a real-world accuracy claim. The app does not need this service to run.

Financial summaries and tax scenarios are deterministic. The frontend and optional API read the shared `tax_rules.json`; the calculator source is `agent-lab/nlu-api/calculations.py`. `Trial_ZRA_Calculator.py` and `ZRA_calculator.py` are command-line entry points into the same engine, so they no longer maintain separate tax formulas. Both turnover-tax interpretations remain visible until Finance confirms the applicable base.

The web tax view projects the last 90 days to an annual amount. The API accepts monthly or annual turnover. Compare outputs only when the input period and assumptions match.

### Run the optional FastAPI Agent Lab

In PowerShell from the repository root:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r agent-lab/nlu-api/requirements.txt
uvicorn app:app --app-dir agent-lab/nlu-api --host 127.0.0.1 --port 4176
```

Then set `VITE_AGENT_API_URL=http://127.0.0.1:4176` in `.env.local` and restart Vite. The API allows the local Vite origins by default. For a hosted API, set `ZEDBIZ_ALLOWED_ORIGINS` to the exact frontend origin. The frontend Content Security Policy in `vercel.json` must also include the exact API origin in `connect-src`.

Try the API at `http://127.0.0.1:4176/docs`. To run its calculator checks:

```powershell
python -m unittest discover -s tests -v
Push-Location agent-lab/nlu-api
python -m unittest discover -s tests -v
Pop-Location
python Trial_ZRA_Calculator.py
```

## Hosting on Vercel

Import this repository as a Vite project with the default build command `npm run build` and output directory `dist`. `vercel.json` includes SPA route fallback and security headers. The default Vercel demo uses the in-browser model and synthetic records; it does not require a Python service or environment secret. If you connect a separately hosted FastAPI service, restrict CORS to the exact Vercel origin and update the Content Security Policy for that service host.

## Security and privacy in this demo

- Default business data and agent processing stay in the browser. Synthetic entries and edits persist in `localStorage`; demo-session state uses `sessionStorage`.
- Agent history records the event type and outcome, not the raw note text.
- The public demo gate is a short-lived navigation convenience only. It does not protect sensitive records. There is no real account system, server authorization, shared database, or multi-user isolation.
- Do not enter real business, identity, tax or payment information.
- Security response headers are configured in `vercel.json`. If the optional API is hosted separately, allow only the app origin and avoid wildcard CORS.

## Team work incorporated

- **Joshua:** frontend layout and interaction design. This app treats his contribution as the presentation layer; the calculator logic is separate.
- **Dev B:** shared ZRA reference rules and the original trial calculator concept. The scripts now use one shared engine, including annualizing monthly turnover before checking the annual turnover-tax ceiling.
- **Dev A:** synthetic intent-classifier direction. The compact local classifier is the no-key default; her FastAPI/SVM baseline remains available for separate evaluation.
- **Head-dev integration:** connects the agent draft flow to the ledger review queue, deterministic dashboard/calculation tools, sample activity trail, demo-session UX, Vercel routing and headers, and validation.

## Not production-ready yet

Real authentication and server-side authorization, durable tenant-isolated storage, verified tax rules and eligibility logic, real-world and local-language model evaluation, receipt OCR, Zamtel USSD/SMS/connectivity, and ZRA integration remain future layers. No AI prediction can confirm a transaction or determine tax payable.
