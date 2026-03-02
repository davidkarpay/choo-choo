/**
 * FollowControl.tsx
 *
 * React-leaflet component that auto-pans the map to keep the followed
 * train centered. Must be rendered as a child of MapContainer.
 * The follow UI banner is rendered by NationalMapScene.
 *
 * Part of: Choo-Choo USA — Phase 2
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useTrainStore } from '../../stores/useTrainStore';

export function FollowControl() {
  const map = useMap();
  const followedTrainId = useTrainStore((s) => s.followedTrainId);

  useEffect(() => {
    if (!followedTrainId) return;

    const interval = setInterval(() => {
      const train = useTrainStore.getState().trains.find((t) => t.id === followedTrainId);
      if (train && train.currentPosition[0] !== 0) {
        map.panTo(train.currentPosition, { animate: true, duration: 0.5 });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [followedTrainId, map]);

  return null;
}
