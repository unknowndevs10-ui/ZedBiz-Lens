# ZedBiz Lens — Agent Lab

Standalone interface and workflow prototype for exploring a voice-first business assistant before integration with the ZedBiz application.

## Open

Open `index.html` in a modern browser. Voice entry uses the browser's Speech Recognition API when available. The current voice locale is set to English (South Africa) as a nearby browser-supported English option; availability and recognition quality depend on browser and device.

## What this prototype demonstrates

- Voice or typed business notes.
- Draft transaction extraction for a small set of English sale and expense phrases.
- Owner confirmation before a record enters the in-memory session ledger.
- A session-only sales, expenses, and recorded cash-movement snapshot.
- Clarification when the event type or amount is unclear.
- A separate interface and flow that can later be wired to a replaceable agent API.

## Current boundaries

- No AI model is connected yet. Parsing is a small, explicit rule-based stub for interface testing.
- No database, backend, external service, ZRA/Zamtel integration, filing, tax calculation, or persistent storage is active.
- The snapshot's `sales - expenses` is only recorded cash movement. It is not gross profit, taxable profit, or a bank balance.
- COGS and inventory are not inferred. Local-language support is not implemented or claimed yet.
- Confirmed records exist only until the page is refreshed or reset.

## Next design step

Keep the UI and agent behind a clear request/response boundary. The future agent should return a proposed structured event, confidence/uncertainty and clarification prompts; the host application should own confirmation, authorization, persistence, calculations and audit history. Developer B's pending transaction-classification work can be evaluated against that boundary when it is submitted.

