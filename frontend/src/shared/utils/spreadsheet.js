/**
 * Spreadsheet helpers for the admin / seller bulk upload screens.
 * Parsing happens in the browser so the preview is instant; the backend
 * re-validates every row on both the preview (dryRun) and the commit call.
 */
import Papa from 'papaparse';
import { readSheet } from 'read-excel-file/browser';

export const SPREADSHEET_ACCEPT = '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const normalizeHeader = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isEmptyCell = (value) => value === null || value === undefined || String(value).trim() === '';

async function readRawRows(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.xlsx')) {
    return readSheet(file);
  }
  if (name.endsWith('.csv') || file?.type === 'text/csv') {
    return new Promise((resolve, reject) => {
      // Blank lines are kept (and skipped below) so reported row numbers match the sheet.
      Papa.parse(file, {
        skipEmptyLines: false,
        complete: (result) => resolve(result.data),
        error: reject,
      });
    });
  }
  if (name.endsWith('.xls')) {
    throw new Error('Old .xls files are not supported — in Excel use "Save As" → .xlsx or .csv');
  }
  throw new Error('Upload a .csv or .xlsx file');
}

/**
 * Parse a CSV / XLSX file into objects keyed by the column spec.
 *
 * @param {File} file
 * @param {Array<{key: string, label: string, aliases?: string[], required?: boolean}>} columns
 * @returns {Promise<{rows: object[], missingColumns: string[], ignoredColumns: string[]}>}
 *   Each row also carries `__rowNumber` (its line in the sheet, header = 1).
 */
export async function parseSpreadsheet(file, columns) {
  const raw = await readRawRows(file);
  const headerIndex = raw.findIndex((r) => Array.isArray(r) && r.some((c) => !isEmptyCell(c)));
  if (headerIndex === -1) throw new Error('The file is empty');

  const lookup = new Map();
  columns.forEach((col) => {
    [col.key, col.label, ...(col.aliases || [])].forEach((name) => lookup.set(normalizeHeader(name), col.key));
  });

  const headers = raw[headerIndex];
  const keyByIndex = headers.map((h) => lookup.get(normalizeHeader(h)) || null);
  const found = new Set(keyByIndex.filter(Boolean));

  const missingColumns = columns.filter((c) => c.required && !found.has(c.key)).map((c) => c.label);
  const ignoredColumns = headers.filter((h, i) => !keyByIndex[i] && !isEmptyCell(h)).map(String);

  const rows = [];
  raw.slice(headerIndex + 1).forEach((cells, offset) => {
    if (!Array.isArray(cells) || cells.every(isEmptyCell)) return;
    const row = { __rowNumber: headerIndex + offset + 2 };
    keyByIndex.forEach((key, i) => {
      if (!key) return;
      const value = cells[i];
      row[key] = value instanceof Date ? value.toISOString().slice(0, 10) : (value ?? '');
    });
    rows.push(row);
  });

  return { rows, missingColumns, ignoredColumns };
}

const csvEscape = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const UTF8_BOM = String.fromCharCode(0xfeff);

/** Download a CSV that opens cleanly in Excel (UTF-8 BOM keeps ₹ and Hindi text intact). */
export function downloadCsv(filename, headers, rows = []) {
  const lines = [headers, ...rows].map((r) => r.map(csvEscape).join(','));
  const blob = new Blob([`${UTF8_BOM}${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Strip the client-only row number before sending rows to the API. */
export const stripRowMeta = (rows) => rows.map((row) => {
  const copy = { ...row };
  delete copy.__rowNumber;
  return copy;
});
