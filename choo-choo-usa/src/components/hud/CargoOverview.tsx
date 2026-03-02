/**
 * CargoOverview.tsx
 *
 * Dashboard panel showing cargo statistics: tons moved, pending
 * shipments, and a breakdown by cargo type.
 *
 * Part of: Choo-Choo USA — Phase 3
 */

import { useCargoStore } from '../../stores/useCargoStore';
import { useStatsStore } from '../../stores/useStatsStore';
import type { CargoType } from '../../types/cargo';

const CARGO_COLORS: Record<CargoType, string> = {
  coal: '#2E2E38',
  grain: '#D4A843',
  produce: '#2D5A3D',
  livestock: '#8C6E4A',
  automobiles: '#5B98B5',
  steel: '#8C8C8C',
  fuel: '#1A1A2E',
  chemicals: '#7B4F9D',
  lumber: '#6B4226',
  packages: '#C45B3E',
  passengers: '#E8913A',
};

export function CargoOverview() {
  const shipments = useCargoStore((s) => s.shipments);
  const deliveredCount = useCargoStore((s) => s.deliveredCount);
  const deliveredTons = useCargoStore((s) => s.deliveredTons);
  const todayStats = useStatsStore((s) => s.today);

  // Count shipments by type
  const waitingByType = new Map<string, number>();
  const inTransitByType = new Map<string, number>();
  for (const s of shipments) {
    const map = s.status === 'waiting' ? waitingByType : inTransitByType;
    map.set(s.type, (map.get(s.type) ?? 0) + 1);
  }

  const allTypes = new Set([...waitingByType.keys(), ...inTransitByType.keys()]);

  return (
    <div className="dashboard-panel">
      <h3 className="dashboard-panel__title">Cargo</h3>

      <div className="dashboard-panel__stats">
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{Math.round(deliveredTons).toLocaleString()}</span>
          <span className="dashboard-panel__stat-label">Total Tons Delivered</span>
        </div>
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{deliveredCount}</span>
          <span className="dashboard-panel__stat-label">Shipments Completed</span>
        </div>
        <div className="dashboard-panel__stat">
          <span className="dashboard-panel__stat-value">{Math.round(todayStats.cargoTonsMoved).toLocaleString()}</span>
          <span className="dashboard-panel__stat-label">Tons Today</span>
        </div>
      </div>

      <div className="dashboard-panel__stat">
        <span className="dashboard-panel__stat-value">{shipments.length}</span>
        <span className="dashboard-panel__stat-label">Active Shipments</span>
      </div>

      {allTypes.size > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 6, opacity: 0.7 }}>
            By Type
          </div>
          {[...allTypes].map((type) => {
            const waiting = waitingByType.get(type) ?? 0;
            const inTransit = inTransitByType.get(type) ?? 0;
            const total = waiting + inTransit;
            const maxBar = 20;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: CARGO_COLORS[type as CargoType] ?? '#888',
                  flexShrink: 0,
                }} />
                <span style={{ width: 70, fontSize: '0.7rem', fontWeight: 600 }}>
                  {type}
                </span>
                <div style={{
                  flex: 1, height: 6, background: 'rgba(26,26,46,0.1)', borderRadius: 3,
                }}>
                  <div style={{
                    width: `${Math.min(100, (total / maxBar) * 100)}%`,
                    height: '100%',
                    background: CARGO_COLORS[type as CargoType] ?? '#888',
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <span style={{ fontSize: '0.65rem', minWidth: 30, textAlign: 'right' }}>
                  {total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
