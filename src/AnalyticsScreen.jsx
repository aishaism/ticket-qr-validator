/**
 * AnalyticsScreen.jsx
 * Attendance analytics derived from localStorage history.
 * Clearly communicates that data is local to this browser.
 */

import { useMemo } from 'react';
import { BarChart2, CheckCircle, XCircle, Activity, Calendar, Info } from 'lucide-react';

function getDateKey(isoString) {
  return isoString ? isoString.slice(0, 10) : null;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function shortDayLabel(dateKey) {
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function AnalyticsScreen({ history }) {
  const stats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);

    let totalChecks = history.length;
    let validated = 0;
    let alreadyValidated = 0;
    let notFound = 0;
    let errors = 0;
    let today = 0;

    history.forEach((r) => {
      if (getDateKey(r.checkTimestamp) === todayKey) today++;
      if (r.status === 'validated') validated++;
      else if (r.status === 'already_validated') alreadyValidated++;
      else if (r.status === 'not_found') notFound++;
      else if (r.status === 'error') errors++;
    });

    return { totalChecks, validated, alreadyValidated, notFound, errors, today };
  }, [history]);

  // 7-day activity data
  const chartData = useMemo(() => {
    const last7 = getLast7Days();
    const byDate = {};
    last7.forEach((d) => { byDate[d] = { checks: 0, validated: 0 }; });

    history.forEach((r) => {
      const key = getDateKey(r.checkTimestamp);
      if (key && byDate[key] !== undefined) {
        byDate[key].checks++;
        if (r.status === 'validated' || r.status === 'already_validated') {
          byDate[key].validated++;
        }
      }
    });

    return last7.map((d) => ({
      date: d,
      label: shortDayLabel(d),
      checks: byDate[d].checks,
      validated: byDate[d].validated,
    }));
  }, [history]);

  const maxChecks = Math.max(...chartData.map((d) => d.checks), 1);

  const successfulCheckIns = stats.validated;
  const totalOutcomes = stats.totalChecks || 1;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attendance Analytics</h1>
        <p className="page-subtitle">Overview of ticket checks recorded in this browser.</p>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-banner">
        <Info size={15} />
        <span>
          Analytics are calculated from checks recorded in <strong>this browser only</strong>.
          Data is stored in localStorage and is not shared across devices or browsers.
        </span>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Checks</span>
            <div className="stat-card-icon stat-icon-purple">
              <Activity size={16} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalChecks}</div>
          <div className="stat-card-sub">All ticket validation attempts</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Successful Check-ins</span>
            <div className="stat-card-icon stat-icon-success">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="stat-card-value">{stats.validated}</div>
          <div className="stat-card-sub">First-time validations</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Checks Today</span>
            <div className="stat-card-icon stat-icon-info">
              <Calendar size={16} />
            </div>
          </div>
          <div className="stat-card-value">{stats.today}</div>
          <div className="stat-card-sub">Validation attempts today</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Not Found</span>
            <div className="stat-card-icon stat-icon-error">
              <XCircle size={16} />
            </div>
          </div>
          <div className="stat-card-value">{stats.notFound}</div>
          <div className="stat-card-sub">Tickets not in system</div>
        </div>
      </div>

      {/* 7-day Bar Chart */}
      <div className="chart-card">
        <div className="chart-title">7-Day Activity</div>
        {stats.totalChecks === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}>
            <div className="empty-state-icon"><BarChart2 size={24} /></div>
            <div className="empty-state-text">No check data yet. Validate some tickets to see activity.</div>
          </div>
        ) : (
          <>
            <div className="bar-chart">
              {chartData.map((day) => {
                const checkHeight = Math.max((day.checks / maxChecks) * 110, day.checks > 0 ? 6 : 2);
                const validatedHeight = Math.max((day.validated / maxChecks) * 110, day.validated > 0 ? 4 : 0);
                return (
                  <div className="bar-group" key={day.date} title={`${day.label}: ${day.checks} checks, ${day.validated} validated`}>
                    <div className="bar-value" style={{ visibility: day.checks > 0 ? 'visible' : 'hidden' }}>
                      {day.checks}
                    </div>
                    <div className="bar-fill-wrapper">
                      <div
                        className="bar-fill bar-fill-checks"
                        style={{ height: `${checkHeight}px` }}
                      />
                      <div
                        className="bar-fill bar-fill-validated"
                        style={{ height: `${validatedHeight}px` }}
                      />
                    </div>
                    <div className="bar-label">{day.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: 'rgba(156,95,255,0.3)', border: '1px solid rgba(156,95,255,0.5)' }} />
                Total checks
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: 'var(--purple-primary)' }} />
                Validated
              </div>
            </div>
          </>
        )}
      </div>

      {/* Outcome Breakdown */}
      <div className="card">
        <div className="card-title">
          <BarChart2 size={15} />
          Validation Outcome Breakdown
        </div>

        {stats.totalChecks === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}>
            <div className="empty-state-text">No data available yet.</div>
          </div>
        ) : (
          <div className="outcome-grid">
            {[
              { label: 'Validated (new)', count: stats.validated, color: 'var(--success-color)' },
              { label: 'Already Validated', count: stats.alreadyValidated, color: 'var(--warning-color)' },
              { label: 'Not Found', count: stats.notFound, color: 'var(--error-color)' },
              { label: 'Errors', count: stats.errors, color: 'var(--text-muted)' },
            ].map(({ label, count, color }) => {
              const pct = Math.round((count / totalOutcomes) * 100);
              return (
                <div className="outcome-item" key={label}>
                  <div className="outcome-info">
                    <div className="outcome-label">{label}</div>
                    <div className="outcome-count" style={{ color }}>{count}</div>
                    <div className="outcome-bar-bg">
                      <div
                        className="outcome-bar-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="outcome-pct">{pct}% of total</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
