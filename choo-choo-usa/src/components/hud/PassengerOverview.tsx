/**
 * PassengerOverview.tsx
 *
 * Dashboard panel showing passenger statistics: in-transit count,
 * delivered today, and a scrollable list of active passengers.
 *
 * Part of: Choo-Choo USA — Phase 3
 */

import { usePassengerStore } from '../../stores/usePassengerStore';
import { useStatsStore } from '../../stores/useStatsStore';

export function PassengerOverview() {
  const passengers = usePassengerStore((s) => s.passengers);
  const arrivedCount = usePassengerStore((s) => s.arrivedCount);
  const todayStats = useStatsStore((s) => s.today);

  const inTransit = passengers.filter((p) => p.status === 'in_transit');
  const waiting = passengers.filter((p) => p.status === 'waiting');

  return (
    <div className="dashboard-panel">
      <h3 className="dashboard-panel__title">Passengers</h3>

      <div className="dashboard-panel__stats">
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{arrivedCount}</span>
          <span className="dashboard-panel__stat-label">Total Arrived</span>
        </div>
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{todayStats.passengersDelivered}</span>
          <span className="dashboard-panel__stat-label">Delivered Today</span>
        </div>
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{inTransit.length}</span>
          <span className="dashboard-panel__stat-label">In Transit</span>
        </div>
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{waiting.length}</span>
          <span className="dashboard-panel__stat-label">Waiting</span>
        </div>
      </div>

      {inTransit.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 6, opacity: 0.7 }}>
            Riding the Rails
          </div>
          <div style={{ maxHeight: 140, overflowY: 'auto' }}>
            {inTransit.slice(0, 20).map((p) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.7rem', padding: '2px 0',
                borderBottom: '1px solid rgba(26,26,46,0.08)',
              }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ opacity: 0.6 }}>
                  {p.activity === 'sleeping' ? 'zzz' :
                   p.activity === 'eating' ? 'eating' :
                   p.activity === 'reading' ? 'reading' :
                   p.activity === 'looking_out_window' ? 'sightseeing' :
                   p.activity === 'talking' ? 'chatting' :
                   p.activity}
                </span>
              </div>
            ))}
            {inTransit.length > 20 && (
              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>
                +{inTransit.length - 20} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
