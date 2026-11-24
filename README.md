# ZedBiz Lens

**UnknownDevs · Zamtel × ZRA Innovation Challenge · Intelligent Customer and Business Ecosystem**

ZedBiz Lens is a synthetic-data prototype for small and informal businesses in Zambia. It brings everyday records, clear business summaries and tax-readiness indicators into one calm workspace. The AI layer helps turn short notes into reviewable drafts and routes supported requests to deterministic business tools.

> **Demo only.** All seeded businesses and transactions are fictional. Tax scenarios use reference assumptions in `tax_rules.json`; they are not tax advice, an eligibility decision, or a filing calculation. Finance/ZRA must confirm the treatment before real use.

## Run the web demo

Requires Node.js 18 or newer.

### Quick preview from the downloaded ZIP (Windows)

The ZIP includes the built demo. Extract it, then double-click `START-DEMO.bat`. Python 3 is required for this one-click preview; it uses only Python's standard library and opens the dashboard directly in your browser. Keep the launcher window open while using the app, and press Ctrl+C in that window to stop it. If a port from 8000 to 8009 is busy, the launcher automatically tries the next one.

### Run the source for development

```powershell
npm install
npm run dev
```

Open the local Vite URL. The landing page is public. Users can create an account with email and password or continue with Google, then complete the guided business profile before the dashboard.

```powershell
npm test
npm run build
npm run preview
```

The test suite checks the local intent baseline. The calculator tests are in `agent-lab/nlu-api/tests` and `tests`.

## What the prototype does

- **Record keeping:** generate 120 days of deterministic synthetic activity for a Soweto Market tomato trader, Kabulonga Mini-Mart, Kitwe Auto-Spares Shop and a profitable solar-services SME. Add a note; review, edit, confirm or reject the resulting draft.
- **Receipt capture:** camera or image upload opens a receipt review. A configured vision service can extract fields; without one, the owner enters supplier, date, amount, stock cost, other business cost and optional item prices manually. No fixture values are invented. The reviewed values become pending drafts; mixed receipts split into stock and other-cost drafts that must reconcile to the receipt total. Photos are stored in per-user IndexedDB on that browser and attached to drafts, not synced to cloud storage. OCR images are sent to the configured extraction endpoint.
- **Business onboarding:** after secure email signup and any required email confirmation, the owner completes an 11-step guided business profile before entering the workspace. The onboarding screen has no dashboard/sidebar, covers business type, operations, location, goals, legal form, activity, and self-reported registration readiness, then shows workspace setup and a personalized welcome before opening the dashboard. ZedBiz applies answers as AI guidance context; it does not train a model or verify status with government systems.
- **Account & business:** inside the workspace, the page is a business overview, not onboarding. It shows the business identity, activity, location, legal form, operating context, priorities, and self-reported PACRA/ZRA/VAT readiness. Updates use one page and do not restart setup or alter the ledger. Account email and password controls are available there.
- **Workspace appearance:** the Settings page offers Mist (whitesmoke, default) and Night themes, comfortable or compact spacing, and reduced motion. Preferences are saved locally in the browser and do not change financial data.
- **AI Agent Lab:** a small synthetic intent classifier recognizes sale, expense, summary or unsupported requests. It can prepare a sale/expense draft or call the confirmed-record summary tool. A possible duplicate is held for review.
- **Voice:** browser speech recognition and speech synthesis are optional. Voice recognition is English-only in this demo and may use the browser's speech service. Typing works without it.
- **Dashboard:** totals, trend charts, expense breakdown, performance comparison and recent records update from confirmed entries. A 30-day revenue outlook uses a clearly labelled deterministic baseline offline; it is not presented as XGBoost.
- **Tax readiness:** the app shows two turnover-tax scenarios and VAT threshold progress. It does not select a tax base, calculate income-tax liability or calculate VAT payable.
- **Reports:** download synthetic financial and illustrative tax-position PDFs from confirmed records.
- **Light workspace:** a whitesmoke canvas with ZedBiz teal and amber accents, compact navigation, and reduced-motion support.
- **Layered system:** business access and capture feed structured records, AI interpretation, deterministic finance/tax readiness, and a future connectivity ecosystem. Zamtel SMS/USSD and ZRA services are not connected in the prototype.

## Account setup still required

### Supabase Auth

The app uses Supabase Auth for email/password accounts and Google OAuth. Enable email signups in Supabase Dashboard > Authentication > Settings. For Google sign-in, enable the Google provider under Authentication > Sign In / Providers and add its OAuth client ID and secret. Add `https://zedbiz-lens.vercel.app/login` and your local Vite origin to the Supabase redirect URL allowlist. Google's OAuth client must also allow the Supabase callback URL shown in the provider setup.

1. `.env.example` shows the optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` overrides. The connected project's browser-safe URL and publishable key are bundled as defaults so the ZIP and Vercel build can sign in without build-time secrets. Never use a secret/service-role key in Vite.
2. `public.business_profiles` stores a profile under each Auth user ID with row-level security. The migration `202611210001_self_service_business_profiles.sql` grants each authenticated user access to their own row only.
3. `public.team_members` remains an internal role/label list for the UnknownDevs team. It no longer blocks business-account signup or onboarding.
4. Email signup may require the user to confirm the address before returning to ZedBiz. On first sign-in, the multi-step business setup still runs before the dashboard.
5. Restart Vite or rebuild `dist` after changing the environment values.

Passwords are created per account and reset through the email flow. Do not share a common password sheet.

## AI and calculation design

The default app runs an offline Naive Bayes intent baseline over 44 fictional English phrases. It uses no model API key. This is a wiring prototype, not a dependable business classifier. Accuracy has not been validated on real operators, accents, noisy speech or local languages. Low-confidence and unsupported requests are held for clarification. An agent-proposed record remains pending until a person confirms it.

The local Agent Lab includes Dev A's optional FastAPI/SVM baseline. Set `VITE_AGENT_API_URL` in `.env.local` to use that service instead of the browser baseline. It uses a small synthetic dataset and the training report in `agent-lab/nlu-api/artifacts/metadata.json`; its reported synthetic test score is not a real-world accuracy claim. The app does not need this service to run.

Financial summaries and tax scenarios are deterministic. The frontend and optional API read the shared `tax_rules.json`; the calculator source is `agent-lab/nlu-api/calculations.py`. `Trial_ZRA_Calculator.py` and `ZRA_calculator.py` are command-line entry points into the same engine, so they no longer maintain separate tax formulas. Both turnover-tax interpretations remain visible until Finance confirms the applicable base.

The web tax view projects the last 90 days to an annual amount. The API accepts monthly or annual turnover. Compare outputs only when the input period and assumptions match.

### Dev 2 integration seam

`src/services/engineAdapter.ts` isolates the optional receipt and forecast services from the interface. Set `VITE_ENGINE_API_URL` to a service that implements `POST /receipts/extract` and `POST /forecast/revenue`. Receipt extraction should return supplier, date, line items, COGS, expenses, total and confidence. Forecast requests contain confirmed revenue history and a 30-day horizon. If the URL is unset, the owner can still enter receipt details manually and the app uses a transparent moving-average/drift baseline for revenue. The adapter is the intended handoff point for a validated Donut-compatible extractor and forecast model; it does not claim either model is already running.

Public pages: `/how-it-works` explains the capture and review flow; `/scope` explains AI, financial and tax boundaries. The homepage scenario chips open isolated, read-only synthetic workspaces.

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

Import this repository as a Vite project with the default build command `npm run build` and output directory `dist`. The connected Supabase URL and publishable key are already bundled as safe client defaults; you can instead override them with Vercel's Production, Preview and Development environment variables. `vercel.json` includes SPA route fallback and security headers. The in-browser model and synthetic records do not require a Python service. If you connect a separately hosted FastAPI service, restrict CORS to the exact Vercel origin and update the Content Security Policy for that service host.

## Security and privacy in this demo

- Business profiles use Supabase Auth and database row-level security. Each profile is readable and writable only by its owning account.
- Synthetic sample workspaces and transaction records stay in this browser's `localStorage`, with separate storage scopes for each signed-in account. Sample records are read-only, labeled synthetic, and stored separately from that account's own ledger.
- Agent history records the event type and outcome, not the raw note text.
- User transaction records are still a local prototype layer. They are not yet backed by a shared database, so continue using synthetic transaction data only.
- Do not enter real business, identity, tax or payment information.
- Security response headers are configured in `vercel.json`. If the optional API is hosted separately, allow only the app origin and avoid wildcard CORS.

## Team work incorporated

- **Joshua:** frontend layout and interaction design. This app treats his contribution as the presentation layer; the calculator logic is separate.
- **Dev B:** shared ZRA reference rules and the original trial calculator concept. The scripts now use one shared engine, including annualizing monthly turnover before checking the annual turnover-tax ceiling.
- **Dev A:** synthetic intent-classifier direction. The compact local classifier is the no-key default; her FastAPI/SVM baseline remains available for separate evaluation.
- **Head-dev integration:** connects the agent draft flow to the ledger review queue, deterministic dashboard/calculation tools, sample activity trail, dark workspace UX, Vercel routing and headers, and validation.

## Recommended next enhancements

1. **Local-language experience:** co-design consented Bemba, Nyanja, and other phrase sets with traders; show the recognized transcript and let the user correct it before any draft is created.
2. **Receipt vision:** configure and validate an OCR endpoint that highlights uncertain extracted fields; keep owner review and never infer tax treatment from an image alone.
3. **Connectivity resilience:** queue signed, duplicate-safe SMS/USSD events and sync them when data service returns, using a Zamtel sandbox before any live integration.
4. **Tax rules governance:** have Finance approve versioned rules and worked examples, then lock them with regression tests before showing payable amounts.
5. **Production security:** move transaction records from browser storage into owner-scoped Supabase tables, then add audit history and retention controls before accepting real business records.

## Not production-ready yet

Email and Google authentication, owner-scoped business profiles, and the business onboarding flow are implemented in the app. Email signup and Google OAuth still need their provider settings enabled in the connected Supabase project. Durable tenant-isolated transaction storage, verified tax rules and eligibility logic, real-world and local-language model evaluation, receipt OCR, Zamtel USSD/SMS/connectivity, and ZRA integration remain future layers. No AI prediction can confirm a transaction or determine tax payable.
