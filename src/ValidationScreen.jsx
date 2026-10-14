/**
 * ValidationScreen.jsx
 * Main ticket validation screen.
 * Supports QR scanning and manual registration number entry.
 * Calls the validation API and records results to history.
 */

import { useState, useCallback } from 'react';
import { Ticket, CheckCircle, XCircle, AlertTriangle, RotateCcw, Clock, Camera } from 'lucide-react';
import QrScanner from './QrScanner';
import { validateTicket } from './api';
import { saveRecord } from './historyStorage';

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return isoString;
  }
}

function TicketDetails({ ticket }) {
  return (
    <div className="ticket-detail-grid">
      {ticket.id && (
        <div className="ticket-detail-item">
          <span className="ticket-detail-label">Ticket ID</span>
          <span className="ticket-detail-value">{ticket.id}</span>
        </div>
      )}
      {ticket.event && (
        <div className="ticket-detail-item">
          <span className="ticket-detail-label">Event</span>
          <span className="ticket-detail-value">{ticket.event}</span>
        </div>
      )}
      {ticket.holder_name && (
        <div className="ticket-detail-item">
          <span className="ticket-detail-label">Holder</span>
          <span className="ticket-detail-value">{ticket.holder_name}</span>
        </div>
      )}
      {ticket.seat && (
        <div className="ticket-detail-item">
          <span className="ticket-detail-label">Seat</span>
          <span className="ticket-detail-value">{ticket.seat}</span>
        </div>
      )}
      {ticket.validated_at && (
        <div className="ticket-detail-item" style={{ gridColumn: '1/-1' }}>
          <span className="ticket-detail-label">Validated At</span>
          <span className="ticket-detail-value">{formatDateTime(ticket.validated_at)}</span>
        </div>
      )}
    </div>
  );
}

export default function ValidationScreen({ onRecordSaved }) {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { type, title, message, ticket }

  function clearResult() {
    setResult(null);
  }

  function handleRegistrationChange(e) {
    setRegistrationNumber(e.target.value);
    if (result) clearResult();
  }

  // Called when QR scanner finds a code
  const handleQrScan = useCallback((scannedText) => {
    setRegistrationNumber(scannedText);
    setResult(null);
  }, []);

  async function handleValidate(e) {
    e.preventDefault();
    const trimmed = registrationNumber.trim();
    if (!trimmed) return;
    if (isLoading) return;

    setIsLoading(true);
    setResult(null);

    const response = await validateTicket(trimmed);

    let resultToSet;
    let recordStatus;

    if (response.errorType === 'cors_or_network') {
      // Could not reach the server at all
      resultToSet = {
        type: 'error',
        title: 'Cannot Reach Server',
        message:
          'The validation server could not be reached. This may be because it is an internal network endpoint that is not accessible from the browser (CORS restriction), or the server is temporarily unavailable. Please try from the internal network, or contact your event administrator.',
      };
      recordStatus = 'error';
    } else if (response.errorType === 'unknown') {
      resultToSet = {
        type: 'error',
        title: 'Network Error',
        message: `An unexpected error occurred: ${response.errorMessage || 'Please check your internet connection and try again.'}`,
      };
      recordStatus = 'error';
    } else if (response.status === 404) {
      resultToSet = {
        type: 'not_found',
        title: 'Ticket Not Found',
        message:
          response.data?.detail ||
          `No ticket with registration number "${trimmed}" was found in the system.`,
      };
      recordStatus = 'not_found';
    } else if (response.status === 200 && response.data) {
      const ticket = response.data;
      const alreadyValidated = ticket.is_validated && ticket.validated_at;

      if (alreadyValidated) {
        // API is idempotent — ticket was already validated before this check
        resultToSet = {
          type: 'already_validated',
          title: 'Already Validated',
          message: `This ticket was previously validated. No new check-in has been recorded. Validation occurred at: ${formatDateTime(ticket.validated_at)}`,
          ticket,
        };
        recordStatus = 'already_validated';
      } else {
        resultToSet = {
          type: 'success',
          title: 'Ticket Validated',
          message: 'Ticket successfully validated and checked in.',
          ticket,
        };
        recordStatus = 'validated';
      }
    } else {
      // Unexpected status code
      resultToSet = {
        type: 'error',
        title: `Unexpected Response (HTTP ${response.status})`,
        message:
          response.data?.detail ||
          response.data?.message ||
          'The server returned an unexpected response. Please contact your event administrator.',
      };
      recordStatus = 'error';
    }

    // Persist to history
    const record = saveRecord({
      registrationNumber: trimmed,
      status: recordStatus,
      validatedAt: response.data?.validated_at || null,
      errorMessage: resultToSet.type !== 'success' && resultToSet.type !== 'already_validated'
        ? resultToSet.message
        : null,
      ticketData: response.data || null,
    });

    setResult(resultToSet);
    setIsLoading(false);

    // Notify parent so analytics can refresh
    if (onRecordSaved) onRecordSaved(record);
  }

  const canSubmit = registrationNumber.trim().length > 0 && !isLoading;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ticket Validation</h1>
        <p className="page-subtitle">Scan a QR code or enter a registration number to validate a ticket.</p>
      </div>

      <div className="validation-grid">
        {/* Left column: QR Scanner */}
        <div className="card">
          <div className="card-title">
            <Camera size={15} />
            QR Code Scanner
          </div>
          <QrScanner onScanSuccess={handleQrScan} isDisabled={isLoading} />
        </div>

        {/* Right column: Manual entry + result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card manual-section">
            <div className="card-title">
              <Ticket size={15} />
              Manual Entry
            </div>

            <form onSubmit={handleValidate} id="validate-form">
              <div className="form-group">
                <label htmlFor="reg-number-input" className="form-label">
                  Registration Number
                </label>
                <input
                  id="reg-number-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. TKT-2024-001234"
                  value={registrationNumber}
                  onChange={handleRegistrationChange}
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <button
                id="validate-btn"
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Validating…
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Validate Ticket
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result area */}
          {result && (
            <div className="card" id="validation-result">
              {result.type === 'success' && (
                <div className="status-message status-success" style={{ margin: 0 }}>
                  <CheckCircle size={18} className="status-message-icon" />
                  <div className="status-message-body">
                    <div className="status-message-title">{result.title}</div>
                    <div className="status-message-text">{result.message}</div>
                    {result.ticket && <TicketDetails ticket={result.ticket} />}
                  </div>
                </div>
              )}

              {result.type === 'already_validated' && (
                <div className="status-message status-warning" style={{ margin: 0 }}>
                  <Clock size={18} className="status-message-icon" />
                  <div className="status-message-body">
                    <div className="status-message-title">{result.title}</div>
                    <div className="status-message-text">{result.message}</div>
                    {result.ticket && <TicketDetails ticket={result.ticket} />}
                  </div>
                </div>
              )}

              {result.type === 'not_found' && (
                <div className="status-message status-error" style={{ margin: 0 }}>
                  <XCircle size={18} className="status-message-icon" />
                  <div className="status-message-body">
                    <div className="status-message-title">{result.title}</div>
                    <div className="status-message-text">{result.message}</div>
                  </div>
                </div>
              )}

              {result.type === 'error' && (
                <div className="status-message status-error" style={{ margin: 0 }}>
                  <AlertTriangle size={18} className="status-message-icon" />
                  <div className="status-message-body">
                    <div className="status-message-title">{result.title}</div>
                    <div className="status-message-text">{result.message}</div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-ghost"
                onClick={() => {
                  clearResult();
                  setRegistrationNumber('');
                }}
                style={{ marginTop: '12px', width: '100%' }}
                id="clear-result-btn"
              >
                <RotateCcw size={14} />
                Validate Another Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

