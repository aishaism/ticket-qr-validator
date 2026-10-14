/**
 * QrScanner.jsx
 * Camera-based QR code scanner using html5-qrcode library.
 * Handles camera stream lifecycle — starts on mount, stops on unmount or close.
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Info } from 'lucide-react';

const SCANNER_ELEMENT_ID = 'qr-reader';

export default function QrScanner({ onScanSuccess, isDisabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  async function startScanner() {
    setIsStarting(true);
    setScannerError(null);

    try {
      const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use rear camera on mobile
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code successfully scanned
          if (isMountedRef.current) {
            onScanSuccess(decodedText.trim());
            handleClose();
          }
        },
        () => {
          // Scan failure (not finding QR code yet) — ignore these
        }
      );

      if (isMountedRef.current) {
        setIsStarting(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsStarting(false);
        const message =
          err?.message?.includes('Permission')
            ? 'Camera permission denied. Please allow camera access and try again.'
            : err?.message?.includes('no cameras')
            ? 'No camera found on this device.'
            : `Could not start camera: ${err?.message || 'Unknown error'}`;
        setScannerError(message);
        setIsOpen(false);
      }
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      // State 2 = SCANNING, State 3 = PAUSED
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Ignore errors during cleanup
    }
    scannerRef.current = null;
  }

  async function handleOpen() {
    if (isDisabled) return;
    setIsOpen(true);
    // Let the DOM render the scanner container first
    await new Promise((r) => setTimeout(r, 100));
    startScanner();
  }

  async function handleClose() {
    await stopScanner();
    if (isMountedRef.current) {
      setIsOpen(false);
      setScannerError(null);
    }
  }

  return (
    <div className="qr-scanner-wrapper">
      <button
        type="button"
        className={`qr-scanner-toggle ${isOpen ? 'active' : ''}`}
        onClick={isOpen ? handleClose : handleOpen}
        disabled={isDisabled || isStarting}
        id="qr-toggle-btn"
      >
        {isOpen ? (
          <>
            <CameraOff size={16} />
            {isStarting ? 'Starting camera…' : 'Close Camera'}
          </>
        ) : (
          <>
            <Camera size={16} />
            Scan with Camera
          </>
        )}
      </button>

      {/* Scanner container — always in DOM when open so html5-qrcode can attach */}
      <div
        className="qr-video-container"
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        <div id={SCANNER_ELEMENT_ID} />
      </div>

      {scannerError && (
        <div className="status-message status-error" style={{ marginTop: '10px' }}>
          <CameraOff size={16} className="status-message-icon" />
          <div className="status-message-body">
            <div className="status-message-title">Camera Error</div>
            <div className="status-message-text">{scannerError}</div>
          </div>
        </div>
      )}

      {!isOpen && !scannerError && (
        <p className="scanner-hint">
          <Info size={12} />
          Point your camera at a QR code to auto-fill the registration number
        </p>
      )}
    </div>
  );
}
