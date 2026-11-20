# ZedBiz Lens – Frontend (Dev A)

Business financial management for small businesses and informal traders in Zambia.
React + Vite + Tailwind CSS, with Lucide icons and Recharts. The app runs **entirely on mock data** until the FastAPI backend is connected.

> **DEMO MODE** – business data is synthetic. The tax-readiness screen uses reference assumptions in `tax_rules.json`; turnover-tax bases and business eligibility still need Finance review. It is not a tax assessment, filing calculation or compliance check.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

`.env` is optional. Copy `.env.example` to `.env` to change settings.

## Pages

| Route | Page |
| --- | --- |
| `/` | Landing page with the business entry box |
| `/app/transactions` | Review extracted entries (confirm, edit, reject) and the full ledger |
| `/app/dashboard` | Totals, revenue and expense chart, category breakdown, performance summary, recent transactions, period filters |
| `/app/tax` | Illustrative tax position, VAT threshold progress, regime comparison, notifications, explanation of changes |
| `/app/reports` | Business Financial Report and Tax Position Report with preview and PDF download |

Try the flow: landing page → pick an example → **Process entry** → confirm lines → open **Dashboard** and see the numbers move. Use the business switcher (retail shop, hair salon, market trader) and **Reset demo data** in the sidebar.

## Mock mode vs live mode

One setting in `.env`:

```
VITE_USE_MOCK_DATA=true
VITE_API_BASE_URL=http://localhost:8000
```

- `true` (default): `src/services/mockApi.js` serves everything from `localStorage`. No network.
- `false`: `src/services/api.js` calls the FastAPI backend at `VITE_API_BASE_URL`.

Only `src/config.js` reads environment variables. Components never contain URLs.

## Connecting the real backend

The endpoint contract is **not final**. Everything that has to change is in four places:

1. `src/services/api.js` – `ENDPOINTS` (paths) and the `liveApi` request bodies and query names. All paths are placeholders.
2. `src/services/transactionService.js` – `normalizeTransaction()` maps the backend transaction shape to the UI shape (already accepts camelCase and snake_case).
3. `src/services/insightsService.js` – map the backend dashboard and tax responses to the shapes returned by `mockApi.js` (`buildDashboard`, `buildTaxPosition` in `src/utils/finance.js` document them).
4. `src/services/reportService.js` – see below.

Placeholder methods (same names in `mockApi.js` and `liveApi`): `submitEntry`, `getTransactions`, `updateTransaction`, `confirmTransaction`, `rejectTransaction`, `getDashboard`, `getTaxPosition`, `downloadFinancialReport`, `downloadTaxReport`, `listBusinesses`.

### Dev B's PDF generators

All report buttons call `downloadReport(kind, params)` in `src/services/reportService.js`. Two ways to connect:

- Backend generates the PDF: set mock mode off and point `ENDPOINTS.financialReport` / `ENDPOINTS.taxReport` at the endpoints. The response must be the PDF file.
- Browser-side generator: register it once at start-up.

```js
import { registerPdfGenerator } from './services/reportService';
registerPdfGenerator('financial', async ({ businessId, period }) => ({ blob, filename }));
registerPdfGenerator('tax', async ({ businessId }) => ({ blob, filename }));
```

In demo mode the PDFs come from a tiny built-in writer (`src/utils/simplePdf.js`, `reportPdf.js`). They are placeholder layouts and contain no real tax calculations.

## What is simulated

- **Extraction** (`src/utils/mockExtraction.js`): a keyword and regex rule set, not an AI model. The UI labels it "Simulated extraction". Confidence values are a demo heuristic.
- **Dashboard figures**: calculated in `src/utils/finance.js` from confirmed transactions. Gross profit = sales minus "Stock purchases". In live mode the backend owns these numbers.
- **Tax readiness**: the demo reads the shared reference values from root `tax_rules.json`. It shows two turnover-tax interpretations, annualises the last 90 days of confirmed sales, and leaves income-tax liability and VAT payable uncalculated. Finance must confirm eligibility and the turnover-tax base.
- **Synthetic history**: 120 days of data per demo business, generated in `src/data/mockData.js` and slid forward so it always ends today.

## Taxable / not taxable labels

Income entries carry `taxable: 'taxable' | 'not_taxable' | 'unsure'` and a short `taxReason`. In demo mode a placeholder keyword rule sets them (`classifyTaxable` in `src/utils/mockExtraction.js`). The user can override the label in the edit dialog. Income marked not taxable is left out of turnover on the Tax page, and "unsure" entries raise a tax notification. The real classifier should run in the FastAPI backend and return the same fields. See `CLAUDE.md` for rules for AI agents working on this repo.

## Project structure

```
src/
  components/
    common/        Button, Card, Badge, Modal, Notification, States (loading/empty/error), form controls, PeriodFilter, Logo
    layout/        AppShell, Sidebar, Topbar, MobileNav, Navbar, Footer, DemoBanner, BusinessSwitcher
    landing/       Hero, ExampleLedger, Features, AudienceSection
    transactions/  EntryBox, AddEntryModal, EditTransactionModal, TransactionCard, EntryReviewGroup, TransactionTable, ConfidenceMeter
    dashboard/     StatCard, PerformanceSummary, RecentTransactions
    charts/        RevenueExpenseChart, CategoryBreakdown
    tax/           TaxProgress, RegimeComparison
    reports/       ReportCard
  context/         DataContext (business + transactions), ToastContext
  hooks/           useAsync
  pages/           LandingPage, TransactionsPage, DashboardPage, TaxPage, ReportsPage, NotFoundPage
  services/        api.js, mockApi.js, transactionService.js, insightsService.js, reportService.js
  utils/           format, finance, mockExtraction, simplePdf, reportPdf, download, theme
  data/            mockData.js, taxDemo.js
  styles/          index.css
  config.js        App.jsx   main.jsx
```

## Design and accessibility notes

- Palette from the approved brand: Teal `#1F6F6B`, Amber `#E0A84B`, Background `#F2F6F6`, Text `#1E2A2F`, Success `#2E7D4F`, Danger `#B83A3A`. Amber is only used as a fill with dark text.
- Manrope is bundled through `@fontsource-variable/manrope` (no external font requests).
- Mobile-first: bottom navigation on phones, sidebar from `lg`, tables become stacked rows below `md`, no horizontal scrolling.
- Keyboard focus rings, labelled controls, dialog focus trapping, and `prefers-reduced-motion` are supported.
- Pages load on demand and the charts library is a separate chunk to keep the first load light.

## Single-page app hosting

The app uses `BrowserRouter`. Static hosts need a fallback to `index.html` for unknown paths (on GitHub Pages, copy `index.html` to `404.html` or switch to `HashRouter` in `src/main.jsx`).

## Not yet done

- Authentication, real persistence and multi-user data.
- Automated tests. The mock API and main user flow were checked with throwaway scripts, which are not included.
- Verification on real devices and browsers. See the hand-off notes for what was and was not checked.
