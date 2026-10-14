# Gatecheck — Ticket QR Validator

> A professional event ticket validation dashboard with QR scanning, attendance analytics, and validation history. Built with React + Vite.

![Gatecheck App](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **QR Code Scanner** — Scan event tickets with the device camera using `html5-qrcode`
- **Manual Entry** — Type or paste a registration number directly
- **Live API Validation** — Calls the internal transit-zero validation endpoint
- **Attendance Analytics** — Stat cards, 7-day activity bar chart, and outcome breakdown
- **Validation History** — Searchable, filterable table with CSV export
- **Offline-Friendly** — History and analytics persist in browser `localStorage`
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Dark Theme** — Professional dark UI with purple accents

---

## Screenshots

| Ticket Validation | Attendance Analytics | Validation History |
|---|---|---|
| QR scanner + manual entry form | Stat cards + bar chart | Searchable table + CSV export |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/aishaism/ticket-qr-validator.git
cd ticket-qr-validator

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The optimised output is written to `dist/`. Preview it with:

```bash
npm run preview
```

---

## Project Structure

```
src/
├── main.jsx              # React entry point
├── index.css             # Global design system (CSS variables, layout, typography)
├── App.css               # Screen-specific styles
├── App.jsx               # Root component — routing, history state, mobile nav
├── Sidebar.jsx           # Left sidebar navigation
├── ValidationScreen.jsx  # Ticket validation UI + API integration
├── AnalyticsScreen.jsx   # Attendance analytics dashboard
├── HistoryScreen.jsx     # History table with search, filter, CSV export
├── QrScanner.jsx         # Camera QR scanner with lifecycle management
├── api.js                # API communication + error handling
└── historyStorage.js     # localStorage persistence + CSV download utility
```

---

## API Integration

The app validates tickets against:

```
POST https://internal.goxploronline.net/api/transit-zero/tickets/{registration_number}/validate
```

### Expected Responses

| Status | Meaning | App behaviour |
|--------|---------|---------------|
| `200` with `is_validated: false` | First validation | ✅ Success — ticket checked in |
| `200` with `is_validated: true` | Already validated | ⚠️ Warning — previously checked in |
| `404` | Ticket not found | ❌ Error — not in system |
| Network / CORS error | Server unreachable | ❌ Error — helpful message shown |

> **Note:** This endpoint is on an **internal network**. Browser requests from the public internet will fail with a CORS error. The app handles this gracefully and shows a descriptive message. For production use, either configure CORS on the server or proxy the request through a backend.

---

## Known Limitations

1. **CORS restriction** — The validation API is an internal endpoint. Browser requests from external networks will be blocked. The app detects and explains this.
2. **Local-only history** — Validation history is stored in `localStorage` and is not shared across devices or browsers.
3. **No authentication** — The app does not implement API key or token authentication. Add an `Authorization` header in `src/api.js` if the endpoint requires it.
4. **Camera access** — QR scanning requires the browser to have camera permission. HTTPS is required in production (camera access is blocked on plain HTTP except `localhost`).

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| html5-qrcode | 2.3.x | Camera-based QR scanning |
| lucide-react | latest | Icon library |
| Vanilla CSS | — | Styling (no framework) |

---

## License

MIT — see [LICENSE](LICENSE) for details.
