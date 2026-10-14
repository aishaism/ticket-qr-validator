/**
 * HistoryScreen.jsx
 * Displays local validation history with search, filter, and CSV export.
 * History is stored in localStorage and is local to this browser.
 */

import { useState, useMemo } from 'react';
import { History, Search, Download, Trash2, CheckCircle, XCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { downloadHistoryCSV, clearHistory } from './historyStorage';

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return isoString;
  }
}

function StatusBadge({ status }) {
  const map = {
    validated: { label: 'Validated', cls: 'badge-success', Icon: CheckCircle },
    already_validated: { label: 'Already Validated', cls: 'badge-warning', Icon: Clock },
    not_found: { label: 'Not Found', cls: 'badge-error', Icon: XCircle },
    error: { label: 'Error', cls: 'badge-error', Icon: AlertTriangle },
  };
  const config = map[status] || { label: status, cls: 'badge-purple', Icon: Info };
  const { label, cls, Icon } = config;
  return (
    <span className={`badge ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

export default function HistoryScreen({ history, onHistoryCleared }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const matchesSearch =
        !searchQuery ||
        record.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.status.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  function handleExportCSV() {
    if (filteredHistory.length === 0) return;
    downloadHistoryCSV(filteredHistory);
  }

  function handleClearHistory() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setConfirmClear(false);
    if (onHistoryCleared) onHistoryCleared();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Validation History</h1>
        <p className="page-subtitle">All ticket validation checks recorded in this browser session.</p>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-banner">
        <Info size={15} />
        <span>
          History is saved to <strong>this browser's localStorage</strong> only.
          It is not shared across devices, browsers, or users.
        </span>
      </div>

      {/* Controls */}
      <div className="history-controls">
        <div className="history-search">
          <Search size={15} className="history-search-icon" />
          <input
            id="history-search-input"
            type="text"
            className="form-input"
            placeholder="Search by registration number or status…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          id="status-filter-select"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="validated">Validated</option>
          <option value="already_validated">Already Validated</option>
          <option value="not_found">Not Found</option>
          <option value="error">Error</option>
        </select>

        <button
          id="export-csv-btn"
          className="btn btn-ghost"
          onClick={handleExportCSV}
          disabled={filteredHistory.length === 0}
          title="Export current view to CSV"
        >
          <Download size={14} />
          Export CSV
        </button>

        {history.length > 0 && (
          <button
            id="clear-history-btn"
            className="btn btn-ghost"
            onClick={handleClearHistory}
            style={{ color: confirmClear ? 'var(--error-color)' : undefined, borderColor: confirmClear ? 'var(--error-border)' : undefined }}
            title="Clear all history"
          >
            <Trash2 size={14} />
            {confirmClear ? 'Click again to confirm' : 'Clear All'}
          </button>
        )}
      </div>

      {/* Record count */}
      {history.length > 0 && (
        <div className="history-count">
          Showing {filteredHistory.length} of {history.length} records
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <History size={26} />
            </div>
            <div className="empty-state-title">No Validation History</div>
            <p className="empty-state-text">
              Validated tickets will appear here. Go to the Ticket Validation screen to start checking tickets.
            </p>
          </div>
        </div>
      )}

      {/* No results for search/filter */}
      {history.length > 0 && filteredHistory.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={24} />
            </div>
            <div className="empty-state-title">No Results</div>
            <p className="empty-state-text">
              No records match your search or filter. Try adjusting your query.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {filteredHistory.length > 0 && (
        <div className="history-table-wrapper">
          <table className="history-table" id="history-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Status</th>
                <th>Checked At</th>
                <th>Validated At</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record) => (
                <tr key={record.id}>
                  <td className="reg-number-cell">{record.registrationNumber}</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="timestamp-cell">{formatDateTime(record.checkTimestamp)}</td>
                  <td className="timestamp-cell">{formatDateTime(record.validatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
