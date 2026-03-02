/**
 * simulation.ts
 *
 * Master simulation tick loop. Runs at 10 ticks/second. Each tick
 * advances the simulation clock, updates train statuses based on
 * time-of-day, assigns routes, and moves trains along GeoJSON corridors.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - useSimulationStore: master clock and speed
 *   - useTrainStore: train positions and statuses
 *   - useRouteStore: rail corridor data
 *   - geo utilities: route interpolation
 */

import { useSimulationStore } from '../stores/useSimulationStore';
import { useTrainStore } from '../stores/useTrainStore';
import { useRouteStore } from '../stores/useRouteStore';
import { getHour } from '../utils/time';
import { interpolateAlongRoute } from '../utils/geo';

const TICK_INTERVAL = 100; // 10 ticks per second

let tickTimer: number | null = null;
let lastTimestamp = 0;

/**
 * Static mapping of train IDs to their preferred route IDs.
 * Each train runs the same corridor every day. In Phase 3 this
 * becomes dynamic based on cargo demand.
 */
const TRAIN_ROUTE_MAP: Record<string, string> = {
  'big-thunder': 'appalachian-coal',
  'daisy-belle': 'northeast-corridor',
  'iron-mike': 'mountain-pass',
  'starlight-express': 'california-produce',
  'old-faithful': 'grain-belt',
  'copper-king': 'transcon',
};

/**
 * Determine what status trains should be in given the current hour.
 * Trains follow a fixed daily schedule.
 */
function getExpectedStatus(hour: number): 'sleeping' | 'warming_up' | 'departing' | 'en_route' | 'returning' {
  if (hour < 5 || hour >= 20) return 'sleeping';
  if (hour >= 5 && hour < 7) return 'warming_up';
  if (hour >= 7 && hour < 9) return 'departing';
  if (hour >= 9 && hour < 17) return 'en_route';
  return 'returning';
}

function tick() {
  const now = performance.now();
  const deltaMs = lastTimestamp === 0 ? TICK_INTERVAL : now - lastTimestamp;
  lastTimestamp = now;

  const simStore = useSimulationStore.getState();
  simStore.tick(deltaMs);

  const hour = getHour(simStore.clock);
  const expectedStatus = getExpectedStatus(hour);
  const trainStore = useTrainStore.getState();
  const routeStore = useRouteStore.getState();

  // Sim minutes advanced this tick
  const simMinutes = (deltaMs / 1000) * simStore.speed;

  for (const train of trainStore.trains) {
    let transitioned = false;

    // -- Status transitions --
    if (train.status === 'sleeping' && expectedStatus === 'warming_up') {
      trainStore.setTrainStatus(train.id, 'warming_up');
      transitioned = true;
    } else if (train.status === 'warming_up' && expectedStatus === 'departing') {
      trainStore.setTrainStatus(train.id, 'departing');
      transitioned = true;
    } else if (
      (train.status === 'departing' || train.status === 'warming_up') &&
      expectedStatus === 'en_route'
    ) {
      trainStore.setTrainStatus(train.id, 'en_route');
      // Assign route when departing onto the rails
      const routeId = TRAIN_ROUTE_MAP[train.id];
      if (routeId && !train.currentRouteId) {
        trainStore.assignRoute(train.id, routeId);
      }
      transitioned = true;
    } else if (train.status === 'en_route' && expectedStatus === 'returning') {
      trainStore.setTrainStatus(train.id, 'returning');
      transitioned = true;
    } else if (train.status === 'returning' && expectedStatus === 'sleeping') {
      trainStore.setTrainStatus(train.id, 'sleeping');
      trainStore.clearRoute(train.id);
      transitioned = true;
    }

    // Fallback: at high speeds, large deltaMs can skip intermediate states
    if (!transitioned && train.status !== expectedStatus) {
      trainStore.setTrainStatus(train.id, expectedStatus);
      // Handle route assignment/clearing on fallback transitions too
      if (expectedStatus === 'en_route' && !train.currentRouteId) {
        const routeId = TRAIN_ROUTE_MAP[train.id];
        if (routeId) trainStore.assignRoute(train.id, routeId);
      } else if (expectedStatus === 'sleeping' && train.currentRouteId) {
        trainStore.clearRoute(train.id);
      }
    }

    // -- Move trains along their routes --
    if (
      (train.status === 'en_route' || train.status === 'returning' ||
       expectedStatus === 'en_route' || expectedStatus === 'returning') &&
      train.currentRouteId
    ) {
      const route = routeStore.getRouteById(train.currentRouteId);
      if (route) {
        // Calculate journey time: distance / speed = hours, convert to minutes
        const journeyMinutes = (route.lengthMiles / train.speedMph) * 60;

        // Progress increment per tick
        const progressDelta = journeyMinutes > 0 ? simMinutes / journeyMinutes : 0;

        // en_route: progress forward (0→1), returning: progress backward (1→0)
        let newProgress: number;
        const currentStatus = expectedStatus === 'en_route' || expectedStatus === 'returning'
          ? expectedStatus
          : train.status;

        if (currentStatus === 'en_route') {
          newProgress = Math.min(1, train.routeProgress + progressDelta);
        } else {
          // Returning: move backward along the route
          newProgress = Math.max(0, train.routeProgress - progressDelta);
        }

        // Interpolate geographic position along the GeoJSON coordinates
        const coords = route.geometry.coordinates as [number, number][];
        const { position, heading } = interpolateAlongRoute(coords, newProgress);

        trainStore.updateRouteProgress(train.id, newProgress, position, heading);
      }
    }
  }
}

export function startSimulation() {
  if (tickTimer !== null) return;
  lastTimestamp = performance.now();
  tickTimer = window.setInterval(tick, TICK_INTERVAL);
}

export function stopSimulation() {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
    lastTimestamp = 0;
  }
}
