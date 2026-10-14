/**
 * api.js
 * Handles communication with the Gatecheck validation API.
 *
 * Endpoint: POST /api/transit-zero/tickets/{registration_number}/validate
 * Returns:
 *   200 - Ticket object (may have is_validated: true and validated_at set)
 *   404 - { detail: "Ticket not found" }
 *
 * NOTE: This endpoint is internal and may reject browser requests due to CORS.
 * We handle this gracefully and show a clear message to the user.
 */

const API_BASE = 'https://internal.goxploronline.net/api/transit-zero';

/**
 * Validate a ticket by registration number.
 *
 * @param {string} registrationNumber - The ticket registration number to validate
 * @returns {Promise<{ok: boolean, status: number|null, data: any, errorType: string|null}>}
 */
export async function validateTicket(registrationNumber) {
  const url = `${API_BASE}/tickets/${encodeURIComponent(registrationNumber)}/validate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Response body is not valid JSON
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      errorType: null,
    };
  } catch (error) {
    // Network error or CORS rejection
    const isCors =
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('CORS'));

    return {
      ok: false,
      status: null,
      data: null,
      errorType: isCors ? 'cors_or_network' : 'unknown',
      errorMessage: error.message,
    };
  }
}
