/**
 * TrackLayer.tsx
 *
 * Renders rail corridors as styled polylines on the Leaflet map.
 * Phase 5: Uses Canvas renderer for performance with 30+ routes.
 * Supports level-of-detail geometry switching, operator color coding,
 * and active/inactive route visual hierarchy.
 *
 * Part of: Choo-Choo USA — Phase 2 + Phase 5
 */

import { GeoJSON, Tooltip, useMap } from 'react-leaflet';
import { useState, useEffect, useMemo } from 'react';
import { useRouteStore } from '../../stores/useRouteStore';
import { useTrainStore } from '../../stores/useTrainStore';
import type { Route, RouteOperator } from '../../types/route';
import type { PathOptions, LeafletEvent } from 'leaflet';

/** Operator brand colors for route rendering. */
const OPERATOR_COLORS: Record<string, string> = {
  BNSF: '#E87722',
  UP: '#00274C',
  CSX: '#0033A0',
  NS: '#52B848',
  CN: '#E31837',
  Amtrak: '#1A5DAD',
};

interface TrackLayerProps {
  onCorridorClick: (routeId: string) => void;
  /** Set of operator names to show. If empty/undefined, show all. */
  visibleOperators?: Set<string>;
}

export function TrackLayer({ onCorridorClick, visibleOperators }: TrackLayerProps) {
  const routes = useRouteStore((s) => s.routes);
  const trains = useTrainStore((s) => s.trains);
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => { map.off('zoomend', onZoom); };
  }, [map]);

  // Active routes = routes that currently have a train on them
  const activeRouteIds = useMemo(() => {
    const ids = new Set<string>();
    for (const train of trains) {
      if (train.currentRouteId) ids.add(train.currentRouteId);
    }
    return ids;
  }, [trains]);

  // Filter by visible operators
  const filteredRoutes = useMemo(() => {
    if (!visibleOperators || visibleOperators.size === 0) return routes;
    return routes.filter((r) => {
      const op = r.operator ?? 'mixed';
      return visibleOperators.has(op);
    });
  }, [routes, visibleOperators]);

  return (
    <>
      {filteredRoutes.map((route) => (
        <CorridorLine
          key={route.id}
          route={route}
          onClick={onCorridorClick}
          isActive={activeRouteIds.has(route.id)}
          zoom={zoom}
        />
      ))}
    </>
  );
}

function CorridorLine({
  route,
  onClick,
  isActive,
  zoom,
}: {
  route: Route;
  onClick: (id: string) => void;
  isActive: boolean;
  zoom: number;
}) {
  // Use simplified geometry at low zoom, full geometry at high zoom
  const useSimplified = zoom < 9 && route.geometrySimplified;
  const coords = useSimplified
    ? route.geometrySimplified!.coordinates
    : route.geometry.coordinates;

  const geojson: GeoJSON.Feature = {
    type: 'Feature',
    properties: { id: route.id, name: route.name },
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
  };

  // Operator-based color, falling back to route's own color
  const routeColor = (route.operator && OPERATOR_COLORS[route.operator])
    ? OPERATOR_COLORS[route.operator]
    : route.color;

  // Active routes: full opacity + thicker; inactive: dimmed + thinner
  const outerWeight = isActive ? 6 : 4;
  const innerWeight = isActive ? 4 : 2;
  const opacity = isActive ? 0.9 : 0.4;

  const outerStyle: PathOptions = {
    color: '#1A1A2E',
    weight: outerWeight,
    opacity,
    dashArray: '12 6',
    lineCap: 'round',
    lineJoin: 'round',
  };

  const handleEachFeature = (_feature: GeoJSON.Feature, layer: L.Layer) => {
    if ('setStyle' in layer) {
      (layer as L.Path).setStyle(outerStyle);
    }

    layer.on('mouseover', (e: LeafletEvent) => {
      if ('setStyle' in e.target) {
        e.target.setStyle({ weight: 8, opacity: 1, color: '#F4C542' });
      }
    });

    layer.on('mouseout', (e: LeafletEvent) => {
      if ('setStyle' in e.target) {
        e.target.setStyle(outerStyle);
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
        key={`${route.id}-outer-${zoom < 9 ? 'lo' : 'hi'}`}
        data={geojson}
        style={() => outerStyle}
        onEachFeature={handleEachFeature}
      >
        <Tooltip
          className="corridor-tooltip"
          sticky
          direction="top"
          offset={[0, -10]}
        >
          {route.name}{route.operator ? ` (${route.operator})` : ''}
        </Tooltip>
      </GeoJSON>
      {/* Inner colored line */}
      <GeoJSON
        key={`${route.id}-inner-${zoom < 9 ? 'lo' : 'hi'}`}
        data={geojson}
        style={() => ({
          color: routeColor,
          weight: innerWeight,
          opacity: isActive ? 0.95 : 0.5,
          dashArray: '12 6',
          lineCap: 'round',
          lineJoin: 'round',
        })}
        interactive={false}
      />
    </>
  );
}
