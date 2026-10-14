/**
 * historyStorage.js
 * Manages validation history using browser localStorage.
 * History is local to this browser only.
 */

const STORAGE_KEY = 'gatecheck_history';

/**
 * Load all history records from localStorage.
 * Returns an array sorted newest-first.
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Save a new validation check record to history.
 * @param {Object} record - The record to save
 * @param {string} record.registrationNumber - The ticket number checked
 * @param {string} record.status - 'validated' | 'already_validated' | 'not_found' | 'error'
 * @param {string|null} record.validatedAt - ISO timestamp from API or null
 * @param {string|null} record.errorMessage - Error detail if applicable
 * @param {Object|null} record.ticketData - Full ticket object from API if available
 */
export function saveRecord(record) {
  const history = loadHistory();
  const newRecord = {
    id: crypto.randomUUID(),
    checkTimestamp: new Date().toISOString(),
    registrationNumber: record.registrationNumber,
    status: record.status,
    validatedAt: record.validatedAt || null,
    errorMessage: record.errorMessage || null,
    ticketData: record.ticketData || null,
  };
  // Prepend newest first
  history.unshift(newRecord);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full or unavailable
    console.warn('Could not save history to localStorage.');
  }
  return newRecord;
}

/**
 * Clear all history records.
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Convert history records to a CSV string for download.
 * @param {Array} records
 * @returns {string} CSV content
 */
export function historyToCSV(records) {
  const headers = [
    'Registration Number',
    'Status',
    'Check Timestamp',
    'Validated At',
    'Error Message',
  ];

  const rows = records.map((r) => [
    r.registrationNumber,
    r.status,
    r.checkTimestamp,
    r.validatedAt || '',
    r.errorMessage || '',
  ]);

  const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))];
  return lines.join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 * @param {Array} records
 */
export function downloadHistoryCSV(records) {
  const csv = historyToCSV(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gatecheck_history_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
