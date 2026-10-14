/**
 * Sidebar.jsx
 * Left navigation sidebar with Gatecheck branding and screen links.
 * Collapses to a hamburger menu on mobile.
 */

import { Ticket, BarChart2, History, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'validation', label: 'Ticket Validation', Icon: Ticket },
  { id: 'analytics', label: 'Attendance Analytics', Icon: BarChart2 },
  { id: 'history', label: 'Validation History', Icon: History },
];

export default function Sidebar({ activeScreen, onNavigate, isOpen, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        {/* Brand logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <ShieldCheck size={18} color="white" />
          </div>
          <span className="sidebar-logo-text">
            Gate<span>check</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" role="navigation">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${activeScreen === id ? 'active' : ''}`}
              onClick={() => {
                onNavigate(id);
                onClose(); // Close sidebar on mobile after navigation
              }}
              aria-current={activeScreen === id ? 'page' : undefined}
              id={`nav-${id}`}
            >
              <Icon size={18} className="nav-icon" />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div>Gatecheck v1.0</div>
          <div style={{ marginTop: '4px', lineHeight: 1.4 }}>
            Local data only. Not synced across devices.
          </div>
        </div>
      </aside>
    </>
  );
}
