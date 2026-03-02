/**
 * TrackLayer.tsx
 *
 * Renders rail corridors as styled GeoJSON polylines on the Leaflet map.
 * Lines use thick dashed strokes with ink outlines per the style guide.
 * Hover shows corridor name tooltip; click selects the corridor.
 *
 * Part of: Choo-Choo USA — Phase 2
 */

import { GeoJSON, Tooltip } from 'react-leaflet';
import { useRouteStore } from '../../stores/useRouteStore';
import type { Route } from '../../types/route';
import type { PathOptions, LeafletEvent } from 'leaflet';

interface TrackLayerProps {
  onCorridorClick: (routeId: string) => void;
}

export function TrackLayer({ onCorridorClick }: TrackLayerProps) {
  const routes = useRouteStore((s) => s.routes);

  return (
    <>
      {routes.map((route) => (
        <CorridorLine key={route.id} route={route} onClick={onCorridorClick} />
      ))}
    </>
  );
}

function CorridorLine({ route, onClick }: { route: Route; onClick: (id: string) => void }) {
  const geojson: GeoJSON.Feature = {
    type: 'Feature',
    properties: { id: route.id, name: route.name },
    geometry: {
      type: 'LineString',
      coordinates: route.geometry.coordinates,
    },
  };

  const style: PathOptions = {
    color: '#1A1A2E',
    weight: 6,
    opacity: 0.8,
    dashArray: '12 6',
    lineCap: 'round',
    lineJoin: 'round',
  };

  const handleEachFeature = (_feature: GeoJSON.Feature, layer: L.Layer) => {
    // Inner colored line
    const innerStyle: PathOptions = {
      color: route.color,
      weight: 4,
      opacity: 0.9,
      dashArray: '12 6',
      lineCap: 'round',
      lineJoin: 'round',
    };

    if ('setStyle' in layer) {
      // Apply the outer dark outline style
      (layer as L.Path).setStyle(style);
    }

    layer.on('mouseover', (e: LeafletEvent) => {
      if ('setStyle' in e.target) {
        e.target.setStyle({ weight: 8, opacity: 1, color: '#F4C542' });
      }
    });

    layer.on('mouseout', (e: LeafletEvent) => {
      if ('setStyle' in e.target) {
        e.target.setStyle(style);
      }
    });

    layer.on('click', () => {
      onClick(route.id);
    });
  };

  return (
    <>
      {/* Outer dark outline */}
      <GeoJSON
        key={`${route.id}-outer`}
        data={geojson}
        style={() => style}
        onEachFeature={handleEachFeature}
      >
        <Tooltip
          className="corridor-tooltip"
          sticky
          direction="top"
          offset={[0, -10]}
        >
          {route.name}
        </Tooltip>
      </GeoJSON>
      {/* Inner colored line */}
      <GeoJSON
        key={`${route.id}-inner`}
        data={geojson}
        style={() => ({
          color: route.color,
          weight: 3,
          opacity: 0.9,
          dashArray: '12 6',
          lineCap: 'round',
          lineJoin: 'round',
        })}
        interactive={false}
      />
    </>
  );
}
