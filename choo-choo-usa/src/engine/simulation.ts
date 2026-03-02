/**
 * simulation.ts
 *
 * Master simulation tick loop. Runs at 10 ticks/second. Each tick
 * advances the simulation clock, updates train statuses based on
 * time-of-day, moves trains segment-by-segment between stations
 * with dwell times, and triggers cargo/passenger processing.
 *
 * Phase 5 changes: Replaced static TRAIN_ROUTE_MAP with dynamic
 * scheduling via scheduling.ts. Added multi-corridor journey
 * leg transitions at junction stations. Initializes network graph.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - useSimulationStore: master clock and speed
 *   - useTrainStore: train positions and statuses
 *   - useRouteStore: rail corridor data
 *   - useStationStore: station data for dwell times
 *   - useNetworkStore: network graph for multi-corridor journeys
 *   - scheduling: dynamic route assignment
 *   - routeSegments: station progress computation
 *   - geo utilities: route interpolation
 */

import { useSimulationStore } from '../stores/useSimulationStore';
import { useTrainStore } from '../stores/useTrainStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useStationStore } from '../stores/useStationStore';
import { useNetworkStore } from '../stores/useNetworkStore';
import { getHour } from '../utils/time';
import { interpolateAlongRoute } from '../utils/geo';
import { computeStationProgressMap, getDwellMinutes } from '../utils/routeSegments';
import type { StationProgress } from '../utils/routeSegments';
import { eventBus } from './events';
import { generateCargo } from './cargoGeneration';
import { processCargoAtStation } from './cargoTransfer';
import { generatePassengers, updatePassengerActivities } from './passengerGeneration';
import { processPassengersAtStation } from './passengerTransfer';
import { initStatsTracker } from './statsTracker';
import { initSoundEvents } from './soundEvents';
import { getAssignedRoute } from './scheduling';
import type { Route } from '../types/route';
import type { Station } from '../types/station';

const TICK_INTERVAL = 100; // 10 ticks per second

let tickTimer: number | null = null;
let lastTimestamp = 0;

/** Cache station progress maps to avoid recomputing every tick. */
const stationProgressCache = new Map<string, StationProgress[]>();

function getStationProgressMap(route: Route, stations: Station[]): StationProgress[] {
  let cached = stationProgressCache.get(route.id);
  if (!cached) {
    cached = computeStationProgressMap(route, stations);
    stationProgressCache.set(route.id, cached);
  }
  return cached;
}

/** Track previous dayNumber to emit new_day events. */
let lastDayNumber = 0;

/** Track last hour cargo generation ran. */
let lastCargoGenHour = -1;

/** Track last 10-minute block for passenger activity updates. */
let lastActivityBlock = -1;

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

/**
 * Assign a route to a train using dynamic scheduling.
 * Sets up the initial dwell at the first station.
 */
function assignRouteToTrain(
  trainId: string,
  routeStore: ReturnType<typeof useRouteStore.getState>,
  trainStore: ReturnType<typeof useTrainStore.getState>,
  stationStore: ReturnType<typeof useStationStore.getState>,
  dayNumber: number,
): void {
  const train = trainStore.getTrainById(trainId);
  if (!train || train.currentRouteId) return;

  const assignment = getAssignedRoute(train, dayNumber);
  if (!assignment) return;

  trainStore.assignRoute(trainId, assignment.routeId);

  // Set up multi-corridor journey if applicable
  if (assignment.journeyRoutes && assignment.journeyRoutes.length > 1) {
    trainStore.setJourneyPlan(trainId, assignment.journeyRoutes);
  }

  // Start dwell at first station
  const route = routeStore.getRouteById(assignment.routeId);
  if (route) {
    const progressMap = getStationProgressMap(route, stationStore.stations);
    if (progressMap.length > 0) {
      const firstStation = stationStore.getStationById(progressMap[0].stationId);
      if (firstStation) {
        trainStore.setDwellTimer(trainId, getDwellMinutes(firstStation.size), firstStation.id);
      }
    }
  }
}

/**
 * Handle journey leg transition: when a train reaches the end of its
 * current corridor and has more legs in its multi-corridor journey,
 * transition to the next route corridor instead of reversing.
 *
 * Returns true if a leg transition occurred.
 */
function tryJourneyLegTransition(
  trainId: string,
  trainStore: ReturnType<typeof useTrainStore.getState>,
  routeStore: ReturnType<typeof useRouteStore.getState>,
  stationStore: ReturnType<typeof useStationStore.getState>,
): boolean {
  const train = trainStore.getTrainById(trainId);
  if (!train) return false;

  const journeyRoutes = train.currentJourneyRoutes;
  if (!journeyRoutes || journeyRoutes.length <= 1) return false;

  const currentLeg = train.currentJourneyLeg;
  if (currentLeg >= journeyRoutes.length - 1) return false;

  // Advance to next leg
  const nextRouteId = journeyRoutes[currentLeg + 1];
  const nextRoute = routeStore.getRouteById(nextRouteId);
  if (!nextRoute) return false;

  trainStore.advanceJourneyLeg(trainId);
  trainStore.assignRoute(trainId, nextRouteId);
  trainStore.setTrainStatus(trainId, 'en_route');

  // Start dwell at first station of next route
  const progressMap = getStationProgressMap(nextRoute, stationStore.stations);
  if (progressMap.length > 0) {
    const firstStation = stationStore.getStationById(progressMap[0].stationId);
    if (firstStation) {
      trainStore.setDwellTimer(trainId, getDwellMinutes(firstStation.size), firstStation.id);
    }
  }

  return true;
}

function tick() {
  const now = performance.now();
  const deltaMs = lastTimestamp === 0 ? TICK_INTERVAL : now - lastTimestamp;
  lastTimestamp = now;

  const simStore = useSimulationStore.getState();
  const prevDayNumber = simStore.dayNumber;
  simStore.tick(deltaMs);

  const currentDayNumber = simStore.dayNumber;
  const hour = getHour(simStore.clock);
  const expectedStatus = getExpectedStatus(hour);
  const trainStore = useTrainStore.getState();
  const routeStore = useRouteStore.getState();
  const stationStore = useStationStore.getState();

  // Sim minutes advanced this tick
  const simMinutes = (deltaMs / 1000) * simStore.speed;

  // Detect day change
  if (currentDayNumber !== prevDayNumber && lastDayNumber !== currentDayNumber) {
    lastDayNumber = currentDayNumber;
    eventBus.emit('new_day', { dayNumber: currentDayNumber });
  }

  // Cargo/passenger generation runs once per sim-hour
  const currentHour = getHour(simStore.clock);
  if (currentHour !== lastCargoGenHour) {
    lastCargoGenHour = currentHour;
    generateCargo(simStore.clock);
    generatePassengers(simStore.clock);
  }

  // Passenger activity updates every 10 sim-minutes
  const currentBlock = Math.floor(simStore.clock / 10);
  if (currentBlock !== lastActivityBlock) {
    lastActivityBlock = currentBlock;
    updatePassengerActivities(simStore.clock);
  }

  for (const train of trainStore.trains) {
    // -- Status transitions --
    if (train.status === 'sleeping' && expectedStatus === 'warming_up') {
      trainStore.setTrainStatus(train.id, 'warming_up');
    } else if (train.status === 'warming_up' && expectedStatus === 'departing') {
      trainStore.setTrainStatus(train.id, 'departing');
    } else if (
      (train.status === 'departing' || train.status === 'warming_up') &&
      expectedStatus === 'en_route'
    ) {
      trainStore.setTrainStatus(train.id, 'en_route');
      assignRouteToTrain(train.id, routeStore, trainStore, stationStore, currentDayNumber);
    } else if (
      train.status === 'at_station' &&
      expectedStatus === 'returning' &&
      train.dwellTimer <= 0
    ) {
      // Time to return — start reverse traversal
      trainStore.setTrainStatus(train.id, 'returning');
    } else if (train.status === 'en_route' && expectedStatus === 'returning') {
      // Switch to returning mid-segment
      trainStore.setTrainStatus(train.id, 'returning');
    } else if (
      (train.status === 'returning' || train.status === 'at_station') &&
      expectedStatus === 'sleeping'
    ) {
      trainStore.setTrainStatus(train.id, 'sleeping');
      trainStore.clearRoute(train.id);
      trainStore.clearJourneyPlan(train.id);
    } else if (
      train.status !== expectedStatus &&
      train.status !== 'at_station' &&
      expectedStatus === 'sleeping'
    ) {
      // Fallback: force sleep at night regardless of current state
      trainStore.setTrainStatus(train.id, 'sleeping');
      trainStore.clearRoute(train.id);
      trainStore.clearJourneyPlan(train.id);
    } else if (
      train.status === 'sleeping' &&
      (expectedStatus === 'en_route' || expectedStatus === 'departing')
    ) {
      // Fallback for high-speed skip: jump to en_route
      trainStore.setTrainStatus(train.id, 'en_route');
      assignRouteToTrain(train.id, routeStore, trainStore, stationStore, currentDayNumber);
    }

    // -- Segment-based movement --
    if (!train.currentRouteId) continue;
    const route = routeStore.getRouteById(train.currentRouteId);
    if (!route) continue;

    const progressMap = getStationProgressMap(route, stationStore.stations);
    if (progressMap.length < 2) continue;

    const coords = route.geometry.coordinates as [number, number][];
    const journeyMinutes = (route.lengthMiles / train.speedMph) * 60;

    // Handle dwell at station
    if (train.status === 'at_station') {
      if (train.dwellTimer > 0) {
        const remaining = trainStore.tickDwellTimer(train.id, simMinutes);
        if (remaining <= 0) {
          // Dwell complete — determine direction
          const isReturning = expectedStatus === 'returning';

          if (isReturning) {
            // Move to previous station segment
            eventBus.emit('train_departed', { trainId: train.id, stationId: train.dwellStationId });
            if (train.currentSegmentIndex <= 0) {
              // Already at first station, head home
              trainStore.setTrainStatus(train.id, 'returning');
            } else {
              trainStore.setSegmentIndex(train.id, train.currentSegmentIndex - 1);
              trainStore.setTrainStatus(train.id, 'returning');
            }
          } else {
            // Move to next station segment
            eventBus.emit('train_departed', { trainId: train.id, stationId: train.dwellStationId });
            if (train.currentSegmentIndex >= progressMap.length - 2) {
              // Reached last station on this corridor —
              // Try journey leg transition before reversing
              const transitioned = tryJourneyLegTransition(
                train.id, trainStore, routeStore, stationStore
              );
              if (!transitioned) {
                // No more legs: start returning
                trainStore.advanceSegment(train.id);
                trainStore.setTrainStatus(train.id, 'returning');
                trainStore.setSegmentIndex(train.id, progressMap.length - 2);
              }
            } else {
              trainStore.advanceSegment(train.id);
              trainStore.setTrainStatus(train.id, 'en_route');
            }
          }
        }
      }
      // Update position to the dwell station's location
      if (train.dwellStationId) {
        const dwellStation = stationStore.getStationById(train.dwellStationId);
        if (dwellStation) {
          const stationProgress = progressMap.find((sp) => sp.stationId === train.dwellStationId);
          if (stationProgress) {
            const { position, heading } = interpolateAlongRoute(coords, stationProgress.progress);
            trainStore.updateRouteProgress(train.id, stationProgress.progress, position, heading);
          }
        }
      }
      continue;
    }

    // -- Moving between stations --
    if (train.status === 'en_route' || train.status === 'returning') {
      const segIdx = train.currentSegmentIndex;
      const isReturning = train.status === 'returning';

      // Determine start/end progress for current segment
      let segStartProgress: number;
      let segEndProgress: number;

      if (isReturning) {
        // Traversing backwards: segment goes from progressMap[segIdx+1] to progressMap[segIdx]
        if (segIdx >= progressMap.length - 1) continue;
        segStartProgress = progressMap[segIdx + 1].progress;
        segEndProgress = progressMap[segIdx].progress;
      } else {
        // Traversing forward: segment goes from progressMap[segIdx] to progressMap[segIdx+1]
        if (segIdx >= progressMap.length - 1) continue;
        segStartProgress = progressMap[segIdx].progress;
        segEndProgress = progressMap[segIdx + 1].progress;
      }

      // Segment length as fraction of total route
      const segLengthFraction = Math.abs(segEndProgress - segStartProgress);
      // Segment journey time in minutes
      const segJourneyMinutes = segLengthFraction * journeyMinutes;

      // Progress increment within this segment
      const segProgressDelta = segJourneyMinutes > 0 ? simMinutes / segJourneyMinutes : 1;
      const newSegProgress = Math.min(1, train.segmentProgress + segProgressDelta);

      trainStore.updateSegmentProgress(train.id, newSegProgress);

      // Map segment progress to overall route progress
      const routeProgress = segStartProgress + (segEndProgress - segStartProgress) * newSegProgress;
      const clampedProgress = Math.max(0, Math.min(1, routeProgress));
      const { position, heading } = interpolateAlongRoute(coords, clampedProgress);
      trainStore.updateRouteProgress(train.id, clampedProgress, position, heading);

      // Check if we arrived at the next station
      if (newSegProgress >= 1.0) {
        const arrivedStationId = isReturning
          ? progressMap[segIdx].stationId
          : progressMap[segIdx + 1]?.stationId;

        if (arrivedStationId) {
          const arrivedStation = stationStore.getStationById(arrivedStationId);
          if (arrivedStation) {
            trainStore.setDwellTimer(train.id, getDwellMinutes(arrivedStation.size), arrivedStationId);
            eventBus.emit('train_arrived', {
              trainId: train.id,
              stationId: arrivedStationId,
              stationName: arrivedStation.name,
            });
            // Process cargo and passengers at this station
            processCargoAtStation(train.id, arrivedStationId, simStore.clock);
            processPassengersAtStation(train.id, arrivedStationId, simStore.clock);
          }
        }

        // Special case: returning train reached the first station
        if (isReturning && segIdx <= 0) {
          // No more segments to traverse backward, dwell then sleep
        }
      }
    }
  }

}

export function startSimulation() {
  if (tickTimer !== null) return;

  // Initialize the network graph on first start
  const networkStore = useNetworkStore.getState();
  if (!networkStore.initialized) {
    networkStore.initialize();
  }

  initStatsTracker();
  initSoundEvents();
  lastTimestamp = performance.now();
  lastDayNumber = useSimulationStore.getState().dayNumber;
  lastCargoGenHour = getHour(useSimulationStore.getState().clock);
  lastActivityBlock = Math.floor(useSimulationStore.getState().clock / 10);
  tickTimer = window.setInterval(tick, TICK_INTERVAL);
}

export function stopSimulation() {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
    lastTimestamp = 0;
  }
}
