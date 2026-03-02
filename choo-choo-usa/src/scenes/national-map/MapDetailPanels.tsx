/**
 * MapDetailPanels.tsx
 *
 * Detail panels that appear when clicking trains, stations, or corridors
 * on the national map. Styled as storybook parchment panels. Phase 3
 * adds live cargo and passenger data to train and station panels.
 *
 * Part of: Choo-Choo USA — Phase 2 + Phase 3
 */

import { Panel } from '../../components/ui/Panel';
import { useTrainStore } from '../../stores/useTrainStore';
import { useStationStore } from '../../stores/useStationStore';
import { useRouteStore } from '../../stores/useRouteStore';
import { useCargoStore } from '../../stores/useCargoStore';
import { usePassengerStore } from '../../stores/usePassengerStore';
import { availableCars } from '../../engine/cargoCapacity';

interface TrainDetailPanelProps {
  trainId: string;
  onClose: () => void;
  onFollow: (trainId: string) => void;
}

export function MapTrainDetail({ trainId, onClose, onFollow }: TrainDetailPanelProps) {
  const train = useTrainStore((s) => s.getTrainById(trainId));
  const routes = useRouteStore((s) => s.routes);
  const followedId = useTrainStore((s) => s.followedTrainId);
  const cargoOnTrain = useCargoStore((s) => s.getOnTrain(trainId));
  const passengersOnTrain = usePassengerStore((s) => s.getOnTrain(trainId));

  if (!train) return null;

  const route = train.currentRouteId
    ? routes.find((r) => r.id === train.currentRouteId)
    : null;

  const statusLabel = train.status === 'en_route'
    ? `En route on ${route?.name ?? 'unknown corridor'}`
    : train.status === 'at_station' && train.dwellStationId
    ? `Stopped at ${train.dwellStationId}`
    : train.status === 'returning'
    ? `Returning home from ${route?.name ?? 'unknown corridor'}`
    : train.status.replace('_', ' ');

  const progressPct = Math.round(train.routeProgress * 100);
  const freeCars = availableCars(train);
  const usedCars = train.maxCars - freeCars;

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
          <span className="train-detail__stat-label">Capacity</span>
          <span className="train-detail__stat-value">{usedCars}/{train.maxCars} cars</span>
        </div>

        {/* Live cargo */}
        {cargoOnTrain.length > 0 && (
          <div className="train-detail__stat">
            <span className="train-detail__stat-label">Cargo</span>
            <span className="train-detail__stat-value">
              {cargoOnTrain.length} shipments ({cargoOnTrain.reduce((sum, c) => sum + c.quantity, 0)} tons)
            </span>
          </div>
        )}

        {/* Live passengers */}
        {passengersOnTrain.length > 0 && (
          <div className="train-detail__stat">
            <span className="train-detail__stat-label">Passengers</span>
            <span className="train-detail__stat-value">{passengersOnTrain.length} aboard</span>
          </div>
        )}

        {/* Lifetime stats */}
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Lifetime Miles</span>
          <span className="train-detail__stat-value">{Math.round(train.stats.totalMiles).toLocaleString()}</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Deliveries</span>
          <span className="train-detail__stat-value">{train.stats.totalDeliveries}</span>
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
  const waitingCargo = useCargoStore((s) => s.getWaitingAtStation(stationId));
  const waitingPassengers = usePassengerStore((s) => s.getWaitingAtStation(stationId));

  if (!station) return null;

  // Count waiting cargo by type
  const cargoByType = new Map<string, number>();
  for (const c of waitingCargo) {
    cargoByType.set(c.type, (cargoByType.get(c.type) ?? 0) + 1);
  }

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

        {/* Live cargo waiting */}
        {waitingCargo.length > 0 && (
          <div className="train-detail__stat">
            <span className="train-detail__stat-label">Waiting Cargo</span>
            <span className="train-detail__stat-value">
              {waitingCargo.length} shipments
              {cargoByType.size > 0 && ` (${[...cargoByType.entries()].map(([t, n]) => `${n} ${t}`).join(', ')})`}
            </span>
          </div>
        )}

        {/* Live passengers waiting */}
        {waitingPassengers.length > 0 && (
          <div className="train-detail__stat">
            <span className="train-detail__stat-label">Waiting Passengers</span>
            <span className="train-detail__stat-value">{waitingPassengers.length} people</span>
          </div>
        )}

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
