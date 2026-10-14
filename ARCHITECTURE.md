# Gatecheck — Architecture

This document describes the architecture, data flow, and design decisions behind the Gatecheck Ticket QR Validator.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────┐
│                  Browser (React SPA)            │
│                                                 │
│  ┌──────────┐   ┌──────────────────────────┐   │
│  │ Sidebar  │   │      Active Screen       │   │
│  │  (nav)   │   │                          │   │
│  │          │   │  ValidationScreen   ─────┼───┼──► POST /tickets/{reg}/validate
│  │ • Ticket │   │  AnalyticsScreen         │   │        (internal API)
│  │   Valid. │   │  HistoryScreen           │   │
│  │ • Analyt.│   │                          │   │
│  │ • History│   └──────────────────────────┘   │
│  └──────────┘                                   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │           localStorage                   │   │
│  │   gatecheck_history  →  JSON array       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Component Tree

```
App.jsx
├── Sidebar.jsx               — navigation + mobile overlay
└── (active screen)
    ├── ValidationScreen.jsx
    │   └── QrScanner.jsx     — html5-qrcode camera integration
    ├── AnalyticsScreen.jsx
    └── HistoryScreen.jsx
```

---

## State Management

Gatecheck uses **React local state only** — no external state library (no Redux, Zustand, etc.).

| State | Location | Purpose |
|---|---|---|
| `activeScreen` | `App.jsx` | Which screen is shown |
| `sidebarOpen` | `App.jsx` | Mobile sidebar toggle |
| `history` | `App.jsx` | Array of all check records, loaded from localStorage |
| `registrationNumber` | `ValidationScreen` | Controlled input value |
| `isLoading` | `ValidationScreen` | In-flight API request guard |
| `result` | `ValidationScreen` | Last API response to display |

`history` lives in `App.jsx` (not a screen) so that both `AnalyticsScreen` and `HistoryScreen` receive the same data without prop drilling beyond one level.

---

## Data Flow — Ticket Validation

```
User enters registration number (or QR scan auto-fills it)
          │
          ▼
handleValidate() in ValidationScreen.jsx
          │
          ▼
validateTicket(registrationNumber) in api.js
    ├── fetch POST to internal API
    ├── On network/CORS error → return { errorType: 'cors_or_network' }
    └── On HTTP response → return { ok, status, data }
          │
          ▼
ValidationScreen interprets response:
    ├── 200 + is_validated: false → 'success'
    ├── 200 + is_validated: true  → 'already_validated'
    ├── 404                       → 'not_found'
    └── error / unexpected        → 'error'
          │
          ▼
saveRecord() in historyStorage.js
    └── Prepend new record to localStorage array
          │
          ▼
onRecordSaved() callback → App.jsx reloads history from localStorage
    └── Triggers re-render of AnalyticsScreen + HistoryScreen
```

---

## API Module (`src/api.js`)

Single exported function:

```js
validateTicket(registrationNumber) → Promise<{
  ok: boolean,
  status: number | null,
  data: object | null,
  errorType: 'cors_or_network' | 'unknown' | null,
  errorMessage: string | undefined
}>
```

- Uses `fetch()` with `method: 'POST'`
- No request body — the registration number is in the URL path
- Catches `TypeError` (network/CORS failures) and classifies them
- Never throws — always resolves with a structured result

---

## Persistence Layer (`src/historyStorage.js`)

All data is stored under the key `gatecheck_history` in `localStorage` as a JSON array sorted newest-first.

### Record schema

```json
{
  "id": "uuid-v4",
  "checkTimestamp": "2024-10-14T07:09:37.000Z",
  "registrationNumber": "TKT-2024-001234",
  "status": "validated | already_validated | not_found | error",
  "validatedAt": "2024-10-14T07:09:37.000Z | null",
  "errorMessage": "string | null",
  "ticketData": { /* full API response object */ } | null
}
```

### Exported functions

| Function | Purpose |
|---|---|
| `loadHistory()` | Read all records from localStorage |
| `saveRecord(record)` | Prepend a new record |
| `clearHistory()` | Remove all records |
| `downloadHistoryCSV(records)` | Build CSV and trigger browser download |

---

## QR Scanner (`src/QrScanner.jsx`)

Uses the `html5-qrcode` library which wraps the browser's `getUserMedia` API.

**Lifecycle:**
1. User clicks "Scan with Camera" → `startScanner()` called
2. `Html5Qrcode` instance created and attached to `#qr-reader` DOM element
3. Camera stream starts; frames are decoded at 10 fps
4. On successful decode → `onScanSuccess(text)` fires, scanner stops
5. On component unmount → `useEffect` cleanup calls `stopScanner()`
6. On manual close → `handleClose()` calls `stopScanner()`

**Why a ref for the scanner instance?**  
`scannerRef` is a `useRef` (not state) because changing it should not trigger a re-render, and it needs to survive across renders to be cleaned up properly.

---

## Styling Approach

- **Plain CSS** — No Tailwind, no CSS-in-JS, no component library
- **CSS Custom Properties** — All design tokens in `:root` in `index.css`
- **Two stylesheets:**
  - `index.css` — global reset, typography, layout, shared components (buttons, badges, inputs, cards)
  - `App.css` — screen-specific styles (validation grid, chart, table, etc.)
- **Responsive breakpoints:** 900px (validation grid), 768px (sidebar collapse), 600px (analytics grid), 480px (spacing)

---

## Known Limitations & Future Improvements

| Limitation | Suggested Fix |
|---|---|
| CORS blocks API from browser | Add a lightweight proxy server or configure CORS on the API |
| History is browser-local | Replace localStorage with a real database + backend |
| No authentication | Add `Authorization: Bearer <token>` header in `api.js` |
| No offline PWA | Add a service worker and manifest |
| No unit tests | Add Vitest + React Testing Library |
