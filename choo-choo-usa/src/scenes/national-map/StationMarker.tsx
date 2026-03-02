/**
 * StationMarker.tsx
 *
 * Custom Leaflet markers for stations on the national map.
 * Size and visibility scale with station importance and zoom level.
 * Click opens the station detail panel.
 *
 * Part of: Choo-Choo USA — Phase 2
 */

import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStationStore } from '../../stores/useStationStore';
import type { Station, StationSize } from '../../types/station';
import { useState, useEffect } from 'react';

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

/** Minimum zoom level at which each station type becomes visible. */
const ZOOM_THRESHOLDS: Record<StationSize, number> = {
  major_hub: 4,
  regional: 5,
  local: 7,
};

function createStationIcon(size: StationSize): L.DivIcon {
  const px = MARKER_SIZES[size];
  const color = MARKER_COLORS[size];
  return L.divIcon({
    className: '',
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    html: `<div class="station-marker station-marker--${size}" style="background:${color};width:${px}px;height:${px}px"></div>`,
  });
}

export function StationMarkers({ onStationClick }: StationMarkersProps) {
  const stations = useStationStore((s) => s.stations);
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => { map.off('zoomend', onZoom); };
  }, [map]);

  return (
    <>
      {stations.map((station) => (
        <StationDot
          key={station.id}
          station={station}
          zoom={zoom}
          onClick={onStationClick}
        />
      ))}
    </>
  );
}

function StationDot({
  station,
  zoom,
  onClick,
}: {
  station: Station;
  zoom: number;
  onClick: (id: string) => void;
}) {
  if (zoom < ZOOM_THRESHOLDS[station.size]) return null;

  const icon = createStationIcon(station.size);
  const showLabel = zoom >= 6 || (station.size === 'major_hub' && zoom >= 5);

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
          <span className="station-label">{station.name} — {station.city}</span>
        </Tooltip>
      )}
    </Marker>
  );
}
