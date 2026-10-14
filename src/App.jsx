/**
 * App.jsx
 * Root application component.
 * Manages routing between screens, history state, and mobile sidebar toggle.
 */

import { useState, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import ValidationScreen from './ValidationScreen';
import AnalyticsScreen from './AnalyticsScreen';
import HistoryScreen from './HistoryScreen';
import { loadHistory } from './historyStorage';
import './App.css';

/**
 * Load history from localStorage on first render.
 * We keep history in React state so that all screens
 * re-render when a new check is recorded.
 */
function loadInitialHistory() {
  return loadHistory();
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState('validation');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState(loadInitialHistory);

  // Called by ValidationScreen whenever a new check is completed
  const handleRecordSaved = useCallback(() => {
    // Re-load history from localStorage to keep all screens in sync
    setHistory(loadHistory());
  }, []);

  // Called by HistoryScreen when user clears all history
  const handleHistoryCleared = useCallback(() => {
    setHistory([]);
  }, []);

  function navigate(screen) {
    setActiveScreen(screen);
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        {/* Mobile top header */}
        <header className="mobile-header">
          <span className="mobile-logo">Gatecheck</span>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            id="hamburger-btn"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Screen content */}
        <div className="page-wrapper">
          {activeScreen === 'validation' && (
            <ValidationScreen onRecordSaved={handleRecordSaved} />
          )}
          {activeScreen === 'analytics' && (
            <AnalyticsScreen history={history} />
          )}
          {activeScreen === 'history' && (
            <HistoryScreen
              history={history}
              onHistoryCleared={handleHistoryCleared}
            />
          )}
        </div>
      </main>
    </div>
  );
}
