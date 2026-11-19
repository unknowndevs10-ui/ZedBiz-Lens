const moneyFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** K1,200.00 */
export function formatKwacha(value) {
  const amount = Number(value) || 0;
  return `${amount < 0 ? '-' : ''}K${moneyFormatter.format(Math.abs(amount))}`;
}

/** K1.2k - for chart axes and tight spaces */
export function formatCompactKwacha(value) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}K${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}K${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}K${Math.round(abs)}`;
}

export const formatPercent = (value, digits = 1) => `${(Number(value) || 0).toFixed(digits)}%`;

// ---- Dates (all stored as local YYYY-MM-DD strings) ----
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids DST edge cases
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export const diffDays = (a, b) => Math.round((parseISODate(a) - parseISODate(b)) / 86_400_000);
export const todayISO = () => toISODate(new Date());

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
export const formatDate = (iso) => (iso ? longDate.format(parseISODate(iso)) : '');
export const formatShortDate = (iso) => (iso ? shortDate.format(parseISODate(iso)) : '');
