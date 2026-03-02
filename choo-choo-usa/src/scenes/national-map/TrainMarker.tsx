/**
 * TrainMarker.tsx
 *
 * Animated train icons on the national map. Each marker moves with the
 * train's interpolated position, faces the direction of travel, and
 * changes detail level based on zoom.
 *
 * Part of: Choo-Choo USA — Phase 2
 */

import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTrainStore } from '../../stores/useTrainStore';
import type { Train } from '../../types/train';
import { useState, useEffect } from 'react';

interface TrainMarkersProps {
  onTrainClick: (trainId: string) => void;
}

function createTrainIcon(
  train: Train,
  zoom: number,
  isFollowed: boolean,
): L.DivIcon {
  const facingLeft = train.heading > 180;
  const flipStyle = facingLeft ? 'transform:scaleX(-1);' : '';
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

  if (zoom <= 9) {
    // Small train icon at mid zoom
    return L.divIcon({
      className: '',
      iconSize: [28, 20],
      iconAnchor: [14, 10],
      html: `<div class="train-map-marker${followedClass}" style="${flipStyle}">
        <div class="train-map-icon" style="background:${train.color.primary}"></div>
      </div>`,
    });
  }

  // Detailed icon with name at high zoom
  return L.divIcon({
    className: '',
    iconSize: [28, 34],
    iconAnchor: [14, 17],
    html: `<div class="train-map-marker${followedClass}" style="${flipStyle}">
      <div class="train-map-icon" style="background:${train.color.primary}"></div>
      <span class="train-map-label">${train.name}</span>
    </div>`,
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
