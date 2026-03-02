/**
 * IndustryPanel.tsx
 *
 * Dashboard panel showing industries grouped by type with their
 * production rates, cargo types, and supply chain connections.
 *
 * Part of: Choo-Choo USA — Phase 3
 */

import { useStationStore } from '../../stores/useStationStore';

interface IndustryInfo {
  name: string;
  type: string;
  stationName: string;
  produces: string[];
  consumes: string[];
  productionRate: number;
}

export function IndustryPanel() {
  const stations = useStationStore((s) => s.stations);

  // Collect all industries across stations
  const industries: IndustryInfo[] = [];
  for (const station of stations) {
    for (const ind of station.industries) {
      industries.push({
        name: ind.name,
        type: ind.type,
        stationName: station.name,
        produces: ind.produces,
        consumes: ind.consumes,
        productionRate: ind.productionRate,
      });
    }
  }

  // Group by type
  const byType = new Map<string, IndustryInfo[]>();
  for (const ind of industries) {
    const list = byType.get(ind.type) ?? [];
    list.push(ind);
    byType.set(ind.type, list);
  }

  // Only show producing industries (more interesting)
  const producerTypes = [...byType.entries()].filter(([, inds]) =>
    inds.some((i) => i.produces.length > 0)
  );

  return (
    <div className="dashboard-panel">
      <h3 className="dashboard-panel__title">Industries</h3>

      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 10 }}>
        {industries.length} industries across {stations.length} stations
      </div>

      {producerTypes.map(([type, inds]) => {
        const typeName = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <div key={type} style={{ marginBottom: 10 }}>
            <div style={{
              fontWeight: 700, fontSize: '0.75rem',
              borderBottom: '1px solid rgba(26,26,46,0.15)',
              paddingBottom: 3, marginBottom: 4,
            }}>
              {typeName}
            </div>
            {inds.filter((i) => i.produces.length > 0).map((ind) => (
              <div key={ind.name} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.65rem', padding: '2px 0',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{ind.name}</span>
                  <span style={{ opacity: 0.5, marginLeft: 4 }}>({ind.stationName})</span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ opacity: 0.6 }}>{ind.produces.join(', ')}</span>
                  <span style={{
                    fontSize: '0.6rem', padding: '1px 4px', borderRadius: 3,
                    background: ind.productionRate > 0.4 ? 'rgba(45,90,61,0.15)' : 'rgba(26,26,46,0.08)',
                    color: ind.productionRate > 0.4 ? '#2D5A3D' : '#1A1A2E',
                    fontWeight: 600,
                  }}>
                    {Math.round(ind.productionRate * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
