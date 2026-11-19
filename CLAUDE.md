# ZedBiz Lens frontend - rules for AI agents

- Stack: React, Vite, JSX, Tailwind, Lucide, Recharts, npm. Do not add Next.js, Bootstrap, Material UI, Angular, Vue or paid UI libraries.
- Brand colours (do not change): teal #1F6F6B, amber #E0A84B (fill only, dark text on it), background #F2F6F6, text #1E2A2F, success #2E7D4F, danger #B83A3A.
- Keep the "DEMO MODE - All displayed business data is synthetic." banner visible.
- Never invent official Zambian tax rates or claim compliance. Tax numbers live in src/data/taxDemo.js and are placeholders pending Finance team approval.
- All backend calls go through src/services/. Components must not contain URLs. Mock/live is chosen by VITE_USE_MOCK_DATA in src/config.js.
- The backend contract is not final. Adapt response shapes in transactionService.js and insightsService.js, not in components.
- AI tax labels (taxable / not_taxable / unsure) must come from the backend. Never call an AI model from the browser or put API keys in this project. The user always confirms a label.
- Run `npm run build` before finishing. Currency format is K1,200.00.
