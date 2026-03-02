/**
 * TrainMarker.tsx
 *
 * Animated train icons on the national map. Each marker moves with the
 * train's interpolated position, faces the direction of travel using
 * proper heading rotation, and changes detail level based on zoom.
 *
 * Uses inline SVG locomotive silhouettes instead of CSS rectangles,
 * with multi-puff smoke animations trailing behind.
 *
 * Part of: Choo-Choo USA — Phase 2
 *
 * Dependencies:
 *   - react-leaflet: Marker, Tooltip, useMap
 *   - leaflet: L.divIcon
 *   - trainSvgPaths: steamSvg, dieselSvg for silhouette markup
 *   - useTrainStore: Zustand store for train state
 */

import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTrainStore } from '../../stores/useTrainStore';
import { steamSvg, dieselSvg } from '../../utils/trainSvgPaths';
import type { Train } from '../../types/train';
import { useState, useEffect } from 'react';

interface TrainMarkersProps {
  onTrainClick: (trainId: string) => void;
}

/**
 * Generate the SVG markup for a train's type and colors.
 * Cached per train ID since colors don't change at runtime.
 */
const svgCache = new Map<string, string>();

function getTrainSvg(train: Train): string {
  let cached = svgCache.get(train.id);
  if (!cached) {
    cached = train.type === 'steam'
      ? steamSvg(train.color.primary, train.color.secondary, train.color.accent)
      : dieselSvg(train.color.primary, train.color.secondary, train.color.accent);
    svgCache.set(train.id, cached);
  }
  return cached;
}

/**
 * Generate smoke puff spans for the trailing smoke effect.
 * 3 puffs with staggered animation delays create a continuous plume.
 */
function smokePuffsHtml(): string {
  return `<span class="train-smoke-puff" style="animation-delay:0s"></span>` +
    `<span class="train-smoke-puff" style="animation-delay:0.5s"></span>` +
    `<span class="train-smoke-puff" style="animation-delay:1.0s"></span>`;
}

function createTrainIcon(
  train: Train,
  zoom: number,
  isFollowed: boolean,
): L.DivIcon {
  // Heading: 0=N, 90=E, 180=S, 270=W. SVG faces right (East).
  // Rotation: heading - 90 aligns 0°=North → rotated so East-facing SVG points North.
  const rotationDeg = train.heading - 90;
  const followedClass = isFollowed ? ' train-map-marker--followed' : '';

  if (zoom <= 6) {
    // Colored dot at low zoom — large enough to see clearly
    return L.divIcon({
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      html: `<div style="width:20px;height:20px;border-radius:50%;background:${train.color.primary};border:3px solid #1A1A2E;box-shadow:0 0 8px 3px rgba(244,197,66,0.7);z-index:9000;position:relative;"></div>`,
    });
  }

  const svg = getTrainSvg(train);

  if (zoom <= 9) {
    // SVG silhouette at mid zoom — big enough to be recognizable
    const w = 64;
    const h = train.type === 'steam' ? 34 : 30;
    return L.divIcon({
      className: '',
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
      html: `<div class="train-map-marker train-svg-marker${followedClass}" style="width:${w}px;height:${h}px;transform:rotate(${rotationDeg}deg);transform-origin:center;">
        <div class="train-svg-icon" style="width:${w}px;height:${h}px;">${svg}</div>
        <div class="train-smoke-container">${smokePuffsHtml()}</div>
      </div>`,
    });
  }

  // Detailed SVG silhouette with name at high zoom
  const w = 80;
  const h = train.type === 'steam' ? 42 : 36;
  return L.divIcon({
    className: '',
    iconSize: [w, h + 16],
    iconAnchor: [w / 2, h / 2],
    html: `<div class="train-map-marker train-svg-marker${followedClass}" style="transform:rotate(${rotationDeg}deg);transform-origin:center ${h / 2}px;">
      <div class="train-svg-icon" style="width:${w}px;height:${h}px;">${svg}</div>
      <div class="train-smoke-container">${smokePuffsHtml()}</div>
    </div>
    <span class="train-map-label" style="transform:rotate(${-rotationDeg}deg);">${train.name}</span>`,
  });
}

export function TrainMarkers({ onTrainClick }: TrainMarkersProps) {
  const trains = useTrainStore((s) => s.trains);
  const followedTrainId = useTrainStore((s) => s.followedTrainId);
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => { map.off('zoomend', onZoom); };
  }, [map]);

  // Show trains that are out on routes (including stopped at stations)
  const activeTrns = trains.filter(
    (t) =>
      (t.status === 'en_route' || t.status === 'returning' || t.status === 'at_station') &&
      t.currentRouteId &&
      t.currentPosition[0] !== 0
  );

  return (
    <>
      {activeTrns.map((train) => (
        <TrainDot
          key={train.id}
          train={train}
          zoom={zoom}
          isFollowed={train.id === followedTrainId}
          onClick={onTrainClick}
        />
      ))}
    </>
  );
}

function TrainDot({
  train,
  zoom,
  isFollowed,
  onClick,
}: {
  train: Train;
  zoom: number;
  isFollowed: boolean;
  onClick: (id: string) => void;
}) {
  const icon = createTrainIcon(train, zoom, isFollowed);

  return (
    <Marker
      position={train.currentPosition}
      icon={icon}
      eventHandlers={{ click: () => onClick(train.id) }}
    >
      {zoom <= 6 && (
        <Tooltip direction="top" offset={[0, -8]}>
          <span className="station-label">{train.name}</span>
        </Tooltip>
      )}
    </Marker>
  );
}
