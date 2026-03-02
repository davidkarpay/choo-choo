/**
 * FleetOverview.tsx
 *
 * Dashboard panel showing all 6 trains with their current status,
 * cargo capacity utilization, and lifetime stats.
 *
 * Part of: Choo-Choo USA — Phase 3
 */

import { useTrainStore } from '../../stores/useTrainStore';
import { availableCars } from '../../engine/cargoCapacity';

const STATUS_LABELS: Record<string, string> = {
  sleeping: 'Sleeping',
  warming_up: 'Warming Up',
  departing: 'Departing',
  en_route: 'En Route',
  at_station: 'At Station',
  returning: 'Returning',
  arriving: 'Arriving',
  maintenance: 'Maintenance',
};

export function FleetOverview() {
  const trains = useTrainStore((s) => s.trains);

  return (
    <div className="dashboard-panel">
      <h3 className="dashboard-panel__title">Fleet</h3>

      {trains.map((train) => {
        const free = availableCars(train);
        const used = train.maxCars - free;
        const pct = train.maxCars > 0 ? (used / train.maxCars) * 100 : 0;

        return (
          <div key={train.id} style={{
            marginBottom: 10,
            padding: '8px 0',
            borderBottom: '1px solid rgba(26,26,46,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: train.color.primary,
                  border: '1.5px solid #1A1A2E',
                }} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{train.name}</span>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
                background: train.status === 'en_route' || train.status === 'at_station'
                  ? 'rgba(45, 90, 61, 0.15)' : 'rgba(26, 26, 46, 0.08)',
                color: train.status === 'en_route' || train.status === 'at_station'
                  ? '#2D5A3D' : '#1A1A2E',
              }}>
                {train.dwellStationId && train.status === 'at_station'
                  ? `At ${train.dwellStationId}`
                  : STATUS_LABELS[train.status] ?? train.status}
              </span>
            </div>

            {/* Capacity bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: '0.6rem', opacity: 0.6, width: 50 }}>Capacity</span>
              <div style={{
                flex: 1, height: 5, background: 'rgba(26,26,46,0.08)', borderRadius: 3,
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: pct > 80 ? '#C45B3E' : '#F4C542',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.6rem', minWidth: 40, textAlign: 'right' }}>
                {used}/{train.maxCars}
              </span>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
              <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                {Math.round(train.stats.totalMiles)} mi
              </span>
              <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                {train.stats.totalDeliveries} deliveries
              </span>
              <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                {train.passengers.length} passengers
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
