/**
 * NationalMapScene.tsx
 *
 * The "big picture" view: a styled Leaflet map of the continental US
 * with animated train markers, station dots, and rail corridors.
 * Includes time-of-day overlays, detail panels, legend, and HUD.
 *
 * Part of: Choo-Choo USA — Phase 2
 * See: /specs/PHASE_2_NATIONAL_MAP.md for full specification
 *
 * Dependencies:
 *   - leaflet / react-leaflet: map rendering
 *   - zustand stores: simulation, train, route, station, player state
 */

import { useState, useCallback, useEffect } from 'react';
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
import { startSimulation, stopSimulation } from '../../engine/simulation';
import { playUIClick } from '../../utils/sound';
import type { SimulationSpeed } from '../../types/simulation';
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

export function NationalMapScene() {
  const navigate = useNavigate();
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);
  const [legendOpen, setLegendOpen] = useState(false);

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

        <TrackLayer onCorridorClick={handleCorridorClick} />
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

      {/* Legend */}
      <div className="map-legend">
        {legendOpen && <Legend />}
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

function Legend() {
  return (
    <div className="map-legend__body">
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Corridors</div>
      <div className="map-legend__item">
        <div className="map-legend__swatch" style={{ background: '#2E2E38' }} />
        <span>Coal Line</span>
      </div>
      <div className="map-legend__item">
        <div className="map-legend__swatch" style={{ background: '#5B98B5' }} />
        <span>Passenger</span>
      </div>
      <div className="map-legend__item">
        <div className="map-legend__swatch" style={{ background: '#E8913A' }} />
        <span>Freight</span>
      </div>
      <div className="map-legend__item">
        <div className="map-legend__swatch" style={{ background: '#D4A843' }} />
        <span>Agriculture</span>
      </div>
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
    </div>
  );
}
