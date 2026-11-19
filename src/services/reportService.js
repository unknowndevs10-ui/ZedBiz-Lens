import api from './api';
import { saveBlob } from '../utils/download';

/**
 * INTEGRATION POINT FOR DEV B'S PDF GENERATORS
 * --------------------------------------------
 * Every report download goes through downloadReport(). By default it calls the
 * API (mock PDF in demo mode, backend endpoint in live mode). If Dev B's
 * generators run in the browser, register them once at start-up:
 *
 *   registerPdfGenerator('financial', async ({ businessId, period }) => ({ blob, filename }));
 *   registerPdfGenerator('tax',       async ({ businessId }) => ({ blob, filename }));
 *
 * A generator must resolve with { blob: Blob, filename: string }.
 */
export const REPORT_KINDS = { financial: 'financial', tax: 'tax' };

const generators = {
  [REPORT_KINDS.financial]: (params) => api.downloadFinancialReport(params),
  [REPORT_KINDS.tax]: (params) => api.downloadTaxReport(params),
};

export function registerPdfGenerator(kind, generator) {
  if (!generators[kind]) throw new Error(`Unknown report kind: ${kind}`);
  generators[kind] = generator;
}

/** Builds the PDF and saves it to the user's device. */
export async function downloadReport(kind, params) {
  const generate = generators[kind];
  if (!generate) throw new Error(`Unknown report kind: ${kind}`);
  const result = await generate(params);
  if (!result?.blob) throw new Error('The report generator did not return a file.');
  saveBlob(result.blob, result.filename || `zedbiz-${kind}-report.pdf`);
  return result.filename;
}

export const downloadFinancialReport = (params) => downloadReport(REPORT_KINDS.financial, params);
export const downloadTaxReport = (params) => downloadReport(REPORT_KINDS.tax, params);
