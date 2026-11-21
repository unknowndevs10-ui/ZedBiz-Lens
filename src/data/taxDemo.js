import ZRA_TAX_RULES from '../../tax_rules.json';

// One reference file drives the demo's tax scenarios. Values are shown for
// learning only; activity eligibility and tax-base interpretation need review.
export const TAX_DEMO = {
  basisDays: 90,
  turnoverTax: {
    annualCeiling: ZRA_TAX_RULES.turnover_tax.annual_ceiling,
    annualNilBand: ZRA_TAX_RULES.turnover_tax.nil_band_upper,
    monthlyNilBand: ZRA_TAX_RULES.turnover_tax.nil_band_upper / 12,
    rate: ZRA_TAX_RULES.turnover_tax.rate,
    modes: Object.keys(ZRA_TAX_RULES.turnover_tax.calculation_modes),
  },
  vat: {
    standardRate: ZRA_TAX_RULES.vat.standard_rate,
    annualThreshold: ZRA_TAX_RULES.vat.registration_threshold_annual,
    voluntaryFloor: ZRA_TAX_RULES.vat.voluntary_registration_floor,
    watchPointPercent: 80,
  },
  taxYear: ZRA_TAX_RULES.meta.tax_year,
  sourceUrl: 'https://www.zra.org.zm/tax-information/',
  disclaimer:
    'Illustrative tax-readiness view using the linked ZRA reference rules. It is not a tax assessment or filing calculation. The turnover-tax base and business eligibility need Finance review. Income-tax liability and VAT payable are not calculated because the demo lacks reviewed tax profiles, supply classifications, and allowable input-tax records.',
  changes: [
    {
      id: 'threshold',
      title: 'If a regime threshold changes',
      body:
        'Thresholds come from the shared tax rules file. An approved update changes the progress indicator; it does not alter any saved business records.',
    },
    {
      id: 'turnover-base',
      title: 'Turnover tax base requires confirmation',
      body:
        'The demo shows both the excess-only and full-turnover interpretations of the nil band. Finance must confirm the applicable treatment before an amount is selected.',
    },
    {
      id: 'records',
      title: 'Keep the source records reviewable',
      body:
        'Confirmed, dated entries support the estimate. Income marked unsure remains included in the turnover indicator until a person reviews its tax label.',
    },
  ],
};

