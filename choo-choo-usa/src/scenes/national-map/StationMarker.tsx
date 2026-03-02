/**
 * StationMarker.tsx
 *
 * Custom Leaflet markers for stations on the national map.
 * Size and visibility scale with station importance and zoom level.
 * Phase 5: Junction stations get diamond markers. Adjusted zoom
 * thresholds for the expanded 70-station network.
 *
 * Part of: Choo-Choo USA — Phase 2 + Phase 5
 */

import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStationStore } from '../../stores/useStationStore';
import { useNetworkStore } from '../../stores/useNetworkStore';
import type { Station, StationSize } from '../../types/station';
import { useState, useEffect, useMemo } from 'react';

interface StationMarkersProps {
  onStationClick: (stationId: string) => void;
}

const MARKER_SIZES: Record<StationSize, number> = {
  major_hub: 16,
  regional: 12,
  local: 9,
};

const MARKER_COLORS: Record<StationSize, string> = {
  major_hub: '#C45B3E',
  regional: '#E8913A',
  local: '#D4A843',
};

/** Minimum zoom level at which each station type becomes visible.
 *  Phase 5: raised thresholds to reduce clutter with 70 stations. */
const ZOOM_THRESHOLDS: Record<StationSize, number> = {
  major_hub: 4,
  regional: 6,
  local: 8,
};

/** Junction station color — distinct from regular stations. */
const JUNCTION_COLOR = '#F4C542';

function createStationIcon(size: StationSize, isJunction: boolean): L.DivIcon {
  const px = isJunction ? MARKER_SIZES[size] + 4 : MARKER_SIZES[size];
  const color = isJunction ? JUNCTION_COLOR : MARKER_COLORS[size];

  // Junction markers render as diamonds (rotated square)
  const shape = isJunction
    ? `<div class="station-marker station-marker--junction" style="
        background:${color};
        width:${px}px;
        height:${px}px;
        transform:rotate(45deg);
        border:2px solid #1A1A2E;
      "></div>`
    : `<div class="station-marker station-marker--${size}" style="
        background:${color};
        width:${px}px;
        height:${px}px;
      "></div>`;

  return L.divIcon({
    className: '',
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    html: shape,
  });
}

export function StationMarkers({ onStationClick }: StationMarkersProps) {
  const stations = useStationStore((s) => s.stations);
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const networkInitialized = useNetworkStore((s) => s.initialized);
  const isJunction = useNetworkStore((s) => s.isJunction);

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => { map.off('zoomend', onZoom); };
  }, [map]);

  // Memoize junction lookup for all stations
  const junctionSet = useMemo(() => {
    if (!networkInitialized) return new Set<string>();
    return new Set(stations.filter((s) => isJunction(s.id)).map((s) => s.id));
  }, [stations, networkInitialized, isJunction]);

  return (
    <>
      {stations.map((station) => (
        <StationDot
          key={station.id}
          station={station}
          zoom={zoom}
          onClick={onStationClick}
          isJunction={junctionSet.has(station.id)}
        />
      ))}
    </>
  );
}

function StationDot({
  station,
  zoom,
  onClick,
  isJunction,
}: {
  station: Station;
  zoom: number;
  onClick: (id: string) => void;
  isJunction: boolean;
}) {
  if (zoom < ZOOM_THRESHOLDS[station.size]) return null;

  const icon = createStationIcon(station.size, isJunction);
  const showLabel = zoom >= 7 || (station.size === 'major_hub' && zoom >= 5);

  return (
    <Marker
      position={station.position as [number, number]}
      icon={icon}
      eventHandlers={{ click: () => onClick(station.id) }}
    >
      {showLabel && (
        <Tooltip
          permanent
          direction="bottom"
          offset={[0, 8]}
          className=""
        >
          <span className="station-label">
            {station.name} — {station.city}
            {isJunction ? ' (Junction)' : ''}
          </span>
        </Tooltip>
      )}
    </Marker>
  );
}
