# ZedBiz Lens

**UnknownDevs � Zamtel x ZRA Innovation Challenge � Intelligent Customer and Business Ecosystem**

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

Open the local Vite URL. The landing page is public; the app workspace requires a Supabase sign-in from an invited UnknownDevs team account. New team members are guided into a five-step business profile setup after accepting their invite.

```powershell
npm test
npm run build
npm run preview
```

The test suite checks the local intent baseline. The calculator tests are in `agent-lab/nlu-api/tests` and `tests`.

## What the prototype does

- **Record keeping:** generate 120 days of deterministic synthetic activity for a mini-mart, hair studio and market stall. Add a note; review, edit, confirm or reject the resulting draft.
- **Business profile:** a five-step setup asks how to address the user, their role, business type and registration journey, province/market, preferred language, and cash/mobile-money/credit methods. Informal businesses get a formalisation-interest question; registered businesses get self-reported PACRA/TPIN/VAT readiness questions without collecting ID numbers. It creates a clean empty ledger separate from synthetic samples.
- **AI Agent Lab:** a small synthetic intent classifier recognizes sale, expense, summary or unsupported requests. It can prepare a sale/expense draft or call the confirmed-record summary tool. A possible duplicate is held for review.
- **Voice:** browser speech recognition and speech synthesis are optional. Voice recognition is English-only in this demo and may use the browser's speech service. Typing works without it.
- **Dashboard:** totals, trend charts, expense breakdown, performance comparison and recent records update from confirmed entries.
- **Tax readiness:** the app shows two turnover-tax scenarios and VAT threshold progress. It does not select a tax base, calculate income-tax liability or calculate VAT payable.
- **Reports:** download synthetic financial and illustrative tax-position PDFs from confirmed records.
- **Dark theme:** a low-glare charcoal workspace keeps the teal and amber brand accents and respects reduced-motion preferences.

## Team access setup still required

### Supabase team access

The app uses Supabase Auth for email/password sessions. Self-service account creation is not offered in the UI. Add the approved team members from Supabase Dashboard > Authentication > Users using **Invite user**, and keep public signups disabled in Authentication > Settings. The `public.team_members` table is the database allowlist; the app checks it after sign-in. The `public.business_profiles` table stores each member's profile under their Auth user ID with row-level security enabled.

1. `.env.example` shows the optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` overrides. The connected project's browser-safe URL and publishable key are bundled as defaults so the ZIP and Vercel build can sign in without build-time secrets. Never use a secret/service-role key in Vite.
2. The migration at `supabase/migrations/202611200001_team_access_and_business_profiles.sql` creates the allowlist and protected profile table. It has been applied to the connected challenge project.
3. The connected challenge project already has the six approved team entries in `public.team_members`. For a new environment, add the approved team email addresses to that table in Supabase SQL Editor. Keep those addresses in the private project database, not in a public repository.
4. Set the Supabase Auth Site URL to the local app origin during development, and add the local origin plus the final Vercel URL to the allowed redirect URLs. Invite recipients open the secure link, choose their own password, and then complete onboarding.
5. Restart Vite or rebuild `dist` after changing the environment values.

Passwords are set individually through Supabase invite links. Do not share a common password sheet; invite links let each person establish a private password and use the reset flow later.

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

Import this repository as a Vite project with the default build command `npm run build` and output directory `dist`. The connected Supabase URL and publishable key are already bundled as safe client defaults; you can instead override them with Vercel's Production, Preview and Development environment variables. `vercel.json` includes SPA route fallback and security headers. The in-browser model and synthetic records do not require a Python service. If you connect a separately hosted FastAPI service, restrict CORS to the exact Vercel origin and update the Content Security Policy for that service host.

## Security and privacy in this demo

- Team access and business profile records use Supabase Auth and database row-level security. The profile is readable and writable only by its owning team account.
- Synthetic demo transactions and agent history stay in this browser's `localStorage`, with separate storage scopes for each signed-in team member. Sample records remain labeled synthetic.
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
2. **Receipt capture:** add OCR that highlights extracted fields and asks the owner to confirm uncertain values; never infer tax treatment from an image alone.
3. **Connectivity resilience:** queue signed, duplicate-safe SMS/USSD events and sync them when data service returns, using a Zamtel sandbox before any live integration.
4. **Tax rules governance:** have Finance approve versioned rules and worked examples, then lock them with regression tests before showing payable amounts.
5. **Production security:** move transaction records from browser storage into owner-scoped Supabase tables, then add audit history and retention controls before accepting real business records.

## Not production-ready yet

Invited-team authentication, allowlist authorization, row-level secured business profiles, and the first-user onboarding flow are implemented. Durable tenant-isolated transaction storage, verified tax rules and eligibility logic, real-world and local-language model evaluation, receipt OCR, Zamtel USSD/SMS/connectivity, and ZRA integration remain future layers. No AI prediction can confirm a transaction or determine tax payable.

