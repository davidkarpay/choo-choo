/**
 * MapDetailPanels.tsx
 *
 * Detail panels that appear when clicking trains, stations, or corridors
 * on the national map. Styled as storybook parchment panels.
 *
 * Part of: Choo-Choo USA — Phase 2
 */

import { Panel } from '../../components/ui/Panel';
import { useTrainStore } from '../../stores/useTrainStore';
import { useStationStore } from '../../stores/useStationStore';
import { useRouteStore } from '../../stores/useRouteStore';

interface TrainDetailPanelProps {
  trainId: string;
  onClose: () => void;
  onFollow: (trainId: string) => void;
}

export function MapTrainDetail({ trainId, onClose, onFollow }: TrainDetailPanelProps) {
  const train = useTrainStore((s) => s.getTrainById(trainId));
  const routes = useRouteStore((s) => s.routes);
  const followedId = useTrainStore((s) => s.followedTrainId);

  if (!train) return null;

  const route = train.currentRouteId
    ? routes.find((r) => r.id === train.currentRouteId)
    : null;

  const statusLabel = train.status === 'en_route'
    ? `En route on ${route?.name ?? 'unknown corridor'}`
    : train.status === 'returning'
    ? `Returning home from ${route?.name ?? 'unknown corridor'}`
    : train.status.replace('_', ' ');

  const progressPct = Math.round(train.routeProgress * 100);

  return (
    <div className="map-detail">
      <Panel title="" onClose={onClose}>
        <div
          style={{
            height: 8,
            borderRadius: '4px 4px 0 0',
            margin: '-20px -20px 12px',
            backgroundColor: train.color.primary,
          }}
        />
        <div className="train-detail__name">{train.name}</div>
        <p className="train-detail__personality">{train.personality}</p>

        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Status</span>
          <span className="train-detail__stat-value">{statusLabel}</span>
        </div>
        {route && (
          <div className="train-detail__stat">
            <span className="train-detail__stat-label">Progress</span>
            <span className="train-detail__stat-value">{progressPct}%</span>
          </div>
        )}
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Speed</span>
          <span className="train-detail__stat-value">{train.speedMph} mph</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Cargo</span>
          <span className="train-detail__stat-value">{train.cargoCapability.join(', ')}</span>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {followedId !== trainId && (
            <button
              className="map-nav-btn"
              onClick={() => onFollow(trainId)}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Follow This Train
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
}

interface StationDetailPanelProps {
  stationId: string;
  onClose: () => void;
}

export function MapStationDetail({ stationId, onClose }: StationDetailPanelProps) {
  const station = useStationStore((s) => s.getStationById(stationId));

  if (!station) return null;

  return (
    <div className="map-detail">
      <Panel title="" onClose={onClose}>
        <div
          style={{
            height: 8,
            borderRadius: '4px 4px 0 0',
            margin: '-20px -20px 12px',
            backgroundColor: station.size === 'major_hub' ? '#C45B3E' : '#E8913A',
          }}
        />
        <div className="train-detail__name">{station.name}</div>
        <p className="train-detail__personality">{station.description}</p>

        <div className="train-detail__stat">
          <span className="train-detail__stat-label">City</span>
          <span className="train-detail__stat-value">{station.city}, {station.state}</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Size</span>
          <span className="train-detail__stat-value">
            {station.size === 'major_hub' ? 'Major Hub' : station.size === 'regional' ? 'Regional Station' : 'Local Stop'}
          </span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Tracks</span>
          <span className="train-detail__stat-value">{station.trackCount}</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Style</span>
          <span className="train-detail__stat-value">{station.architectureStyle}</span>
        </div>
        {station.industries.length > 0 && (
          <div className="train-detail__stat">
            <span className="train-detail__stat-label">Industries</span>
            <span className="train-detail__stat-value">
              {station.industries.map((i) => i.name).join(', ')}
            </span>
          </div>
        )}
      </Panel>
    </div>
  );
}

interface CorridorDetailPanelProps {
  routeId: string;
  onClose: () => void;
}

export function MapCorridorDetail({ routeId, onClose }: CorridorDetailPanelProps) {
  const route = useRouteStore((s) => s.getRouteById(routeId));
  const trains = useTrainStore((s) => s.trains);

  if (!route) return null;

  const activeTrains = trains.filter((t) => t.currentRouteId === routeId);

  return (
    <div className="map-detail">
      <Panel title="" onClose={onClose}>
        <div
          style={{
            height: 8,
            borderRadius: '4px 4px 0 0',
            margin: '-20px -20px 12px',
            backgroundColor: route.color,
          }}
        />
        <div className="train-detail__name">{route.name}</div>
        <p className="train-detail__personality">{route.description}</p>

        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Length</span>
          <span className="train-detail__stat-value">{route.lengthMiles} miles</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Active Trains</span>
          <span className="train-detail__stat-value">
            {activeTrains.length > 0 ? activeTrains.map((t) => t.name).join(', ') : 'None'}
          </span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Primary Cargo</span>
          <span className="train-detail__stat-value">{route.primaryCargoTypes.join(', ')}</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Stations</span>
          <span className="train-detail__stat-value">{route.stationIds.length} stops</span>
        </div>
      </Panel>
    </div>
  );
}
