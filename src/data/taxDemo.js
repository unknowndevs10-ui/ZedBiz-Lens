// ---------------------------------------------------------------------------
// PLACEHOLDER VALUES - every number here is an illustrative demo assumption.
// They are NOT official Zambian tax rates or thresholds. Replace them with
// values approved by the Finance team (or with live data from the backend).
// ---------------------------------------------------------------------------
export const TAX_DEMO = {
  basisDays: 90, // estimates are built from the last 90 days of confirmed entries
  vatThreshold: 600_000, // annual turnover, placeholder
  turnoverBand: [0.02, 0.04], // placeholder low/high share of turnover
  profitRate: 0.1, // placeholder share of net profit
  vatRate: 0.12, // placeholder
  disclaimer:
    'Illustrative demonstration only. Figures use placeholder assumptions pending Finance team approval. They are not official tax rates, tax advice or a compliance check.',
  changes: [
    {
      id: 'threshold',
      title: 'If a regime threshold changes',
      body:
        'A threshold change moves the point at which a business switches regime. ZedBiz Lens would redraw the progress bar from the new threshold. Your records would not change.',
    },
    {
      id: 'rate',
      title: 'If a rate changes',
      body:
        'Estimates read their rate assumptions from one configuration file, so approved rates can be updated in one place and every estimate refreshes.',
    },
    {
      id: 'records',
      title: 'What stays the same',
      body:
        'Confirmed, dated transactions are the basis of every estimate. Keeping entries confirmed is the most useful preparation before any change.',
    },
  ],
};
