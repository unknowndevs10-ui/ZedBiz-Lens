import rules from '../../tax_rules.json';
import { addDays, todayISO } from '../utils/format';

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const money = (tx) => Math.max(0, Number(tx.amount) || 0);
const norm = (value) => String(value || '').toLowerCase().replace(/[\s-]+/g, '_');

function progressiveTax(profit, bands) {
  let remaining = Math.max(0, profit);
  let floor = 0;
  let total = 0;
  for (const band of bands) {
    const ceiling = band.up_to == null ? Infinity : Number(band.up_to);
    const taxable = Math.max(0, Math.min(remaining, ceiling - floor));
    total += taxable * Number(band.rate);
    remaining -= taxable;
    floor = ceiling;
    if (remaining <= 0) break;
  }
  return round2(total);
}

function turnoverEligibility(profile, annualTurnover) {
  const legalForm = norm(profile?.legalForm);
  const activity = norm(profile?.taxActivity || profile?.businessType);
  const excludedLegal = rules.turnover_tax.eligibility.excluded_legal_forms.map(norm);
  const excludedActivity = rules.turnover_tax.eligibility.excluded_activities.map(norm);
  const activityMatches = (value) => Boolean(activity) && excludedActivity.some((excluded) => activity.includes(excluded) || excluded.includes(activity));
  const reasons = [];
  if (!legalForm) reasons.push('Legal form needs confirmation.');
  if (!activity) reasons.push('Business activity needs confirmation.');
  if (activity === 'other') reasons.push('Confirm whether this activity is covered by the turnover-tax regime.');
  if (excludedLegal.includes(legalForm)) reasons.push('Partnerships are excluded from turnover tax under the reference rules.');
  if (activityMatches('consultancy') || activityMatches('management_consultancy')) reasons.push('Consultancy income is excluded from turnover tax.');
  if (activityMatches('mining')) reasons.push('Mining activity requires a separate eligibility review.');
  if (activityMatches('public_service_vehicle_under_50')) reasons.push('Public service vehicle activity needs a separate tax review.');
  if (annualTurnover > rules.turnover_tax.annual_ceiling) reasons.push('Annualized turnover is above the K5,000,000 ceiling.');
  if (profile?.vatStatus === 'yes' && profile?.vatRegistrationType !== 'voluntary') {
    reasons.push('VAT registration type needs review. ZRA allows voluntary VAT registration to coexist with turnover tax, but statutory VAT status should be confirmed.');
  }
  const complete = legalForm && activity;
  const excluded = excludedLegal.includes(legalForm) || activityMatches('consultancy') || activityMatches('management_consultancy') || activityMatches('mining') || activityMatches('public_service_vehicle_under_50') || annualTurnover > rules.turnover_tax.annual_ceiling;
  return { status: !complete ? 'needs-profile' : excluded ? 'review-required' : reasons.length ? 'review-required' : 'illustrative-eligible', reasons, incomeTaxRegimeRequired: excluded };
}

/** Deterministic demo calculations over confirmed records; no AI-generated math. */
export function calculateTaxReadiness(transactions = [], profile = {}, today = todayISO()) {
  const days = 90;
  const start = addDays(today, -(days - 1));
  const confirmed = transactions.filter((tx) => tx.status === 'confirmed' && tx.date >= start && tx.date <= today);
  const income = confirmed.filter((tx) => tx.type === 'income');
  const expenses = confirmed.filter((tx) => tx.type === 'expense' && tx.category !== 'Owner personal withdrawal');
  const cogsCategories = new Set(rules.accounting.cogs_categories);
  const cogs = expenses.filter((tx) => cogsCategories.has(tx.category)).reduce((sum, tx) => sum + money(tx), 0);
  const operating = expenses.filter((tx) => !cogsCategories.has(tx.category));
  const allowableOperatingExpenses = operating.filter((tx) => tx.taxDeductible === true).reduce((sum, tx) => sum + money(tx), 0);
  const deductionsReviewCount = operating.filter((tx) => tx.taxDeductible !== true && tx.taxDeductible !== false).length;
  const totalSales = income.reduce((sum, tx) => sum + money(tx), 0);
  const grossProfit = totalSales - cogs;
  const netProfit = grossProfit - expenses.filter((tx) => !cogsCategories.has(tx.category)).reduce((sum, tx) => sum + money(tx), 0);
  const annualizedTurnover = totalSales * (365 / days);
  const standardRatedSales = income.filter((tx) => tx.vatTreatment === 'standard_rated').reduce((sum, tx) => sum + money(tx), 0);
  const annualizedStandardRated = standardRatedSales * (365 / days);
  const tot = rules.turnover_tax;
  const excessOnly = round2(Math.max(0, annualizedTurnover - tot.nil_band_upper) * tot.rate);
  const fullTurnover = annualizedTurnover > tot.nil_band_upper ? round2(annualizedTurnover * tot.rate) : 0;
  const eligibility = turnoverEligibility(profile, annualizedTurnover);

  const vatThreshold = rules.vat.registration_threshold_annual;
  const vatProgress = vatThreshold ? annualizedStandardRated / vatThreshold * 100 : 0;
  const vatRegistered = profile?.vatStatus === 'yes';
  const vatTriggered = vatProgress >= 100;
  const relevantSales = income.filter((tx) => tx.vatTreatment === 'standard_rated');
  const outputVat = relevantSales.reduce((sum, tx) => {
    const value = money(tx);
    return sum + (tx.amountIncludesVat === false ? value * rules.vat.standard_rate : value * rules.vat.standard_rate / (1 + rules.vat.standard_rate));
  }, 0);
  const inputInvoices = expenses.filter((tx) => {
    if (!tx.smartInvoiceValid || !tx.supplierTpinVerified || !(Number(tx.inputVatAmount) > 0)) return false;
    const invoiceDate = tx.inputInvoiceDate || tx.date;
    const age = Math.floor((new Date(`${today}T12:00:00`) - new Date(`${invoiceDate}T12:00:00`)) / 86400000);
    return age >= 0 && age <= rules.vat.input_invoice_validity_days;
  });
  const inputVat = inputInvoices.reduce((sum, tx) => sum + Number(tx.inputVatAmount || 0), 0);
  const vatPayableIllustration = round2(outputVat - inputVat);

  const annualizedCogs = cogs * (365 / days);
  const annualizedAllowableOperatingExpenses = allowableOperatingExpenses * (365 / days);
  const taxableProfit = Math.max(0, annualizedTurnover - annualizedCogs - annualizedAllowableOperatingExpenses);
  const legalForm = norm(profile?.legalForm);
  const activity = norm(profile?.taxActivity || profile?.businessType);
  let incomeTax = null;
  let incomeTaxRateLabel = 'Complete the tax profile to unlock';
  let minimumAlternativeTax = null;
  if (legalForm === 'limited_company') {
    const rate = activity.includes('agric') ? rules.income_tax.agriculture_corporate_rate : rules.income_tax.corporate_rate;
    incomeTax = round2(taxableProfit * rate);
    if (eligibility.incomeTaxRegimeRequired) {
      minimumAlternativeTax = round2(annualizedTurnover * rules.income_tax.minimum_alternative_tax_rate);
      incomeTax = Math.max(incomeTax, minimumAlternativeTax);
    }
    incomeTaxRateLabel = `${rate * 100}% corporate${activity.includes('agric') ? ' agriculture' : ''}${minimumAlternativeTax == null ? ' scenario; turnover-tax status needs confirmation' : '; includes MAT floor check'}`;
  } else if (['sole_trader', 'registered_business_name'].includes(legalForm)) {
    incomeTax = progressiveTax(taxableProfit, rules.income_tax.individual_annual_bands);
    incomeTaxRateLabel = 'Progressive individual schedule (0%-37%)';
  } else if (legalForm === 'partnership') {
    incomeTaxRateLabel = 'Partner allocation needs Finance review';
  }

  return {
    taxYear: rules.meta.tax_year,
    sourceUrl: 'https://www.zra.org.zm/tax-information/',
    disclaimer: 'Illustrative estimates only. Tax treatment depends on current law and your verified records. ZedBiz Lens does not file returns or connect to ZRA systems.',
    basis: { start, end: today, days, transactionCount: confirmed.length },
    accounting: {
      totalSales: round2(totalSales), cogs: round2(cogs), allowableOperatingExpenses: round2(allowableOperatingExpenses),
      unreviewedExpenseCount: deductionsReviewCount, grossProfit: round2(grossProfit), netProfit: round2(netProfit),
      annualizedTaxableProfit: round2(taxableProfit),
      ownerWithdrawalsExcluded: confirmed.filter((tx) => tx.type === 'owner_withdrawal' || tx.category === 'Owner personal withdrawal').length,
    },
    turnover: {
      annualized: round2(annualizedTurnover), excessOnly, fullTurnover,
      ceiling: tot.annual_ceiling, nilBand: tot.nil_band_upper, rate: tot.rate,
      eligibility,
    },
    vat: {
      annualizedStandardRated: round2(annualizedStandardRated), threshold: vatThreshold,
      periodStandardRated: round2(standardRatedSales), periodDays: days,
      quarterlyThreshold: rules.vat.registration_threshold_quarterly,
      progressPercent: Math.min(100, round2(vatProgress)), actualProgressPercent: round2(vatProgress),
      registered: vatRegistered, triggered: vatTriggered, shouldEstimate: vatRegistered || vatTriggered,
      outputVat: round2(outputVat), inputVat: round2(inputVat), inputInvoiceCount: inputInvoices.length,
      vatPayableIllustration, standardRate: rules.vat.standard_rate,
      note: vatRegistered ? 'Illustrative VAT period from explicitly standard-rated sales and input VAT with confirmed Smart Invoice and supplier TPIN flags.' : vatTriggered ? 'This is a registration-exposure illustration, not an amount currently payable. Confirm registration status and supplies with ZRA.' : 'Threshold tracking only; VAT payable is not estimated until registered or the threshold marker is reached.',
    },
    incomeTax: {
      annualizedTaxableProfit: round2(taxableProfit), estimatedTax: incomeTax,
      rateLabel: incomeTaxRateLabel, minimumAlternativeTax,
      deductibleExpenses: round2(annualizedCogs + annualizedAllowableOperatingExpenses),
      unreviewedExpenseCount: deductionsReviewCount,
    },
  };
}

