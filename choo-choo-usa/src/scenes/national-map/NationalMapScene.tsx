/**
 * NationalMapScene.tsx
 *
 * The "big picture" view: a styled Leaflet map of the continental US
 * with animated train markers, station dots, and rail corridors.
 * Includes time-of-day overlays, detail panels, legend, HUD,
 * simulation dashboard, and narrator event ticker.
 *
 * Part of: Choo-Choo USA — Phase 2 + Phase 3
 * See: /specs/PHASE_2_NATIONAL_MAP.md for full specification
 *
 * Dependencies:
 *   - leaflet / react-leaflet: map rendering
 *   - zustand stores: simulation, train, route, station, player state
 *   - event bus: narrator messages
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { useTrainStore } from '../../stores/useTrainStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { TrackLayer } from './TrackLayer';
import { StationMarkers } from './StationMarker';
import { TrainMarkers } from './TrainMarker';
import { FollowControl } from './FollowControl';
import { MapTrainDetail, MapStationDetail, MapCorridorDetail } from './MapDetailPanels';
import { Clock } from '../../components/ui/Clock';
import { CargoOverview } from '../../components/hud/CargoOverview';
import { PassengerOverview } from '../../components/hud/PassengerOverview';
import { FleetOverview } from '../../components/hud/FleetOverview';
import { IndustryPanel } from '../../components/hud/IndustryPanel';
import { startSimulation, stopSimulation } from '../../engine/simulation';
import { eventBus } from '../../engine/events';
import { narrateEvent } from '../../engine/narratorMessages';
import { playUIClick } from '../../utils/sound';
import type { SimulationSpeed } from '../../types/simulation';
import type { SimEvent } from '../../engine/events';
import 'leaflet/dist/leaflet.css';
import '../../styles/globals.css';
import '../../styles/storybook.css';
import '../../styles/map.css';

// US center coordinates
const US_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 5;

const SPEEDS: { label: string; value: SimulationSpeed }[] = [
  { label: '\u23F8', value: 0 },
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '15x', value: 15 },
  { label: '60x', value: 60 },
];

type DetailPanel =
  | { type: 'train'; id: string }
  | { type: 'station'; id: string }
  | { type: 'corridor'; id: string }
  | null;

type DashboardTab = 'cargo' | 'passengers' | 'fleet' | 'industries';

/** All operators available for filtering. */
const ALL_OPERATORS = ['BNSF', 'UP', 'CSX', 'NS', 'CN', 'Amtrak'];

const OPERATOR_LEGEND_COLORS: Record<string, string> = {
  BNSF: '#E87722',
  UP: '#00274C',
  CSX: '#0033A0',
  NS: '#52B848',
  CN: '#E31837',
  Amtrak: '#1A5DAD',
};

export function NationalMapScene() {
  const navigate = useNavigate();
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('cargo');
  const [narratorText, setNarratorText] = useState<string | null>(null);
  const narratorTimer = useRef<number | null>(null);
  /** Visible operators — empty set means show all. */
  const [visibleOperators, setVisibleOperators] = useState<Set<string>>(new Set());

  const speed = useSimulationStore((s) => s.speed);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const timeOfDayPeriod = useSimulationStore((s) => s.timeOfDayPeriod);
  const followTrain = useTrainStore((s) => s.followTrain);
  const followedTrainId = useTrainStore((s) => s.followedTrainId);
  const setScene = usePlayerStore((s) => s.setScene);

  // Start simulation when scene mounts
  useEffect(() => {
    setScene('national-map');
    startSimulation();
    return () => stopSimulation();
  }, [setScene]);

  // Subscribe to events for narrator ticker
  useEffect(() => {
    let lastNarration = 0;
    // Phase 5: increased interval proportional to larger train count
    const MIN_INTERVAL = 5000;

    const handler = (event: SimEvent) => {
      const now = Date.now();
      if (now - lastNarration < MIN_INTERVAL) return;

      // Only narrate certain events to avoid spam
      if (event.type === 'cargo_loaded' || event.type === 'passenger_boarded') return;

      const text = narrateEvent(event);
      if (!text) return;

      lastNarration = now;
      setNarratorText(text);

      // Auto-dismiss after 5 seconds
      if (narratorTimer.current) clearTimeout(narratorTimer.current);
      narratorTimer.current = window.setTimeout(() => {
        setNarratorText(null);
      }, 5000);
    };

    const unsubs = [
      eventBus.on('train_arrived', handler),
      eventBus.on('train_departed', handler),
      eventBus.on('cargo_delivered', handler),
      eventBus.on('passenger_arrived', handler),
      eventBus.on('new_day', handler),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
      if (narratorTimer.current) clearTimeout(narratorTimer.current);
    };
  }, []);

  const handleTrainClick = useCallback((trainId: string) => {
    setDetailPanel({ type: 'train', id: trainId });
  }, []);

  const handleStationClick = useCallback((stationId: string) => {
    setDetailPanel({ type: 'station', id: stationId });
  }, []);

  const handleCorridorClick = useCallback((routeId: string) => {
    setDetailPanel({ type: 'corridor', id: routeId });
  }, []);

  const handleFollow = useCallback((trainId: string) => {
    followTrain(trainId);
  }, [followTrain]);

  const closePanel = useCallback(() => {
    setDetailPanel(null);
  }, []);

  const goToRoundhouse = useCallback(() => {
    playUIClick();
    navigate('/');
  }, [navigate]);

  return (
    <div className="national-map">
      {/* Leaflet map */}
      <MapContainer
        center={US_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={4}
        maxZoom={12}
        zoomControl={true}
        className="national-map__leaflet"
        zoomAnimation={true}
        markerZoomAnimation={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <TrackLayer onCorridorClick={handleCorridorClick} visibleOperators={visibleOperators} />
        <StationMarkers onStationClick={handleStationClick} />
        <TrainMarkers onTrainClick={handleTrainClick} />
        <FollowControl />
        <MapStateSync />
      </MapContainer>

      {/* Time-of-day overlay */}
      <div className={`map-time-overlay map-time-overlay--${timeOfDayPeriod}`} />

      {/* HUD */}
      <div className="map-hud">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="map-nav-btn" onClick={goToRoundhouse}>
            Roundhouse
          </button>
          <Clock />
          <button
            className={`map-nav-btn ${dashboardOpen ? 'map-nav-btn--active' : ''}`}
            onClick={() => {
              playUIClick();
              setDashboardOpen(!dashboardOpen);
            }}
            style={{ fontSize: '0.75rem' }}
          >
            Dashboard
          </button>
        </div>
        <div className="top-bar__controls">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              className={`speed-btn ${speed === s.value ? 'speed-btn--active' : ''}`}
              onClick={() => {
                playUIClick();
                setSpeed(s.value);
              }}
              aria-label={s.value === 0 ? 'Pause simulation' : `Set speed to ${s.label}`}
              aria-pressed={speed === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard overlay */}
      {dashboardOpen && (
        <div className="dashboard-overlay">
          <div className="dashboard-tabs">
            {(['cargo', 'passengers', 'fleet', 'industries'] as DashboardTab[]).map((tab) => (
              <button
                key={tab}
                className={`dashboard-tab ${activeTab === tab ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="dashboard-content">
            {activeTab === 'cargo' && <CargoOverview />}
            {activeTab === 'passengers' && <PassengerOverview />}
            {activeTab === 'fleet' && <FleetOverview />}
            {activeTab === 'industries' && <IndustryPanel />}
          </div>
        </div>
      )}

      {/* Detail panels */}
      {detailPanel?.type === 'train' && (
        <MapTrainDetail
          trainId={detailPanel.id}
          onClose={closePanel}
          onFollow={handleFollow}
        />
      )}
      {detailPanel?.type === 'station' && (
        <MapStationDetail
          stationId={detailPanel.id}
          onClose={closePanel}
        />
      )}
      {detailPanel?.type === 'corridor' && (
        <MapCorridorDetail
          routeId={detailPanel.id}
          onClose={closePanel}
        />
      )}

      {/* Follow banner */}
      {followedTrainId && (
        <div className="follow-banner">
          <span>Following {useTrainStore.getState().getTrainById(followedTrainId)?.name}</span>
          <button
            className="follow-banner__stop"
            onClick={() => followTrain(null)}
          >
            Stop Following
          </button>
        </div>
      )}

      {/* Narrator ticker */}
      {narratorText && (
        <div className="narrator-ticker">
          <div className="narrator-ticker__text">{narratorText}</div>
        </div>
      )}

      {/* Legend */}
      <div className="map-legend">
        {legendOpen && (
          <Legend
            visibleOperators={visibleOperators}
            onToggleOperator={(op) => {
              setVisibleOperators((prev) => {
                const next = new Set(prev);
                if (next.has(op)) {
                  next.delete(op);
                } else {
                  next.add(op);
                }
                return next;
              });
            }}
          />
        )}
        <button
          className="map-legend__toggle"
          onClick={() => setLegendOpen(!legendOpen)}
        >
          {legendOpen ? 'Hide Legend' : 'Legend'}
        </button>
      </div>

    </div>
  );
}

/** Syncs map center/zoom to player store for persistence. */
function MapStateSync() {
  const map = useMap();
  const setCamera = usePlayerStore((s) => s.setCamera);
  const setZoom = usePlayerStore((s) => s.setZoom);

  useEffect(() => {
    const sync = () => {
      const center = map.getCenter();
      setCamera(center.lat, center.lng);
      setZoom(map.getZoom());
    };
    map.on('moveend', sync);
    map.on('zoomend', sync);
    return () => {
      map.off('moveend', sync);
      map.off('zoomend', sync);
    };
  }, [map, setCamera, setZoom]);

  return null;
}

function Legend({
  visibleOperators,
  onToggleOperator,
}: {
  visibleOperators: Set<string>;
  onToggleOperator: (op: string) => void;
}) {
  const showAll = visibleOperators.size === 0;

  return (
    <div className="map-legend__body">
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Operators</div>
      {ALL_OPERATORS.map((op) => {
        const isVisible = showAll || visibleOperators.has(op);
        return (
          <div
            key={op}
            className="map-legend__item"
            style={{ cursor: 'pointer', opacity: isVisible ? 1 : 0.4 }}
            onClick={() => onToggleOperator(op)}
          >
            <div
              className="map-legend__swatch"
              style={{ background: OPERATOR_LEGEND_COLORS[op] }}
            />
            <span>{op}</span>
          </div>
        );
      })}

      <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Stations</div>
      <div className="map-legend__item">
        <div className="map-legend__dot" style={{ background: '#C45B3E' }} />
        <span>Major Hub</span>
      </div>
      <div className="map-legend__item">
        <div className="map-legend__dot" style={{ background: '#E8913A', width: 8, height: 8 }} />
        <span>Regional</span>
      </div>
      <div className="map-legend__item">
        <div className="map-legend__dot" style={{ background: '#D4A843', width: 6, height: 6 }} />
        <span>Local</span>
      </div>
      <div className="map-legend__item">
        <div
          className="map-legend__dot"
          style={{
            background: '#F4C542',
            width: 10,
            height: 10,
            transform: 'rotate(45deg)',
            border: '1px solid #1A1A2E',
          }}
        />
        <span>Junction</span>
      </div>
    </div>
  );
}
