/**
 * passengerTransfer.ts
 *
 * Handles boarding and deboarding passengers when a train stops at
 * a station. First deboards passengers at their destination, then
 * boards waiting passengers heading further along the train's route.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - usePassengerStore: passenger state
 *   - useTrainStore: train passenger manifest
 *   - useStationStore: waiting passengers
 *   - useRouteStore: route data (to check destinations are reachable)
 *   - events: event bus
 */

import { usePassengerStore } from '../stores/usePassengerStore';
import { useTrainStore } from '../stores/useTrainStore';
import { useStationStore } from '../stores/useStationStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useNetworkStore } from '../stores/useNetworkStore';
import { eventBus } from './events';

/**
 * Process all passenger operations when a train arrives at a station.
 *
 * Step 1: Deboard passengers whose destination is this station.
 * Step 2: Board waiting passengers whose destination is further along this route.
 *
 * Args:
 *   trainId: The train stopped at the station.
 *   stationId: The station where the train is dwelling.
 *   clock: Current simulation time in minutes.
 */
export function processPassengersAtStation(
  trainId: string,
  stationId: string,
  clock: number,
): void {
  const passengerStore = usePassengerStore.getState();
  const trainStore = useTrainStore.getState();
  const stationStore = useStationStore.getState();

  const train = trainStore.getTrainById(trainId);
  if (!train || !train.currentRouteId) return;

  // Step 1: Deboard passengers at their destination
  const onTrain = passengerStore.getOnTrain(trainId);
  const toDeboard = onTrain.filter((p) => p.destinationStationId === stationId);

  for (const passenger of toDeboard) {
    passengerStore.arrivePassenger(passenger.id, clock);
    eventBus.emit('passenger_arrived', {
      passengerId: passenger.id,
      trainId,
      stationId,
      passengerName: passenger.name,
    });
  }

  // Remove deboarded passengers from train
  if (toDeboard.length > 0) {
    const deboardedIds = new Set(toDeboard.map((p) => p.id));
    trainStore.updateTrainCargo(trainId, (t) => ({
      passengers: t.passengers.filter((p) => !deboardedIds.has(p.id)),
    }));
  }

  // Step 2: Board waiting passengers
  const routeStore = useRouteStore.getState();
  const networkStore = useNetworkStore.getState();
  const route = routeStore.getRouteById(train.currentRouteId);
  if (!route) return;

  // Stations reachable from here on this route
  const reachableOnRoute = new Set(route.stationIds);

  // Also consider stations reachable via downstream junctions (Phase 5)
  const networkReachable = networkStore.initialized
    ? networkStore.getReachableStations(stationId)
    : null;

  const waitingPassengers = passengerStore.getWaitingAtStation(stationId);

  // Cap: max 50 passengers per train (simplification)
  const updatedTrain = trainStore.getTrainById(trainId);
  if (!updatedTrain) return;
  let currentCount = updatedTrain.passengers.length;
  const maxPassengers = 50;

  for (const passenger of waitingPassengers) {
    if (currentCount >= maxPassengers) break;

    // Board if destination is on this route OR reachable via the network
    const onRoute = reachableOnRoute.has(passenger.destinationStationId);
    const networkReachableCheck = networkReachable?.has(passenger.destinationStationId) ?? false;
    if (!onRoute && !networkReachableCheck) continue;

    passengerStore.boardPassenger(passenger.id, trainId, clock);
    stationStore.removeWaitingPassengers(stationId, [passenger.id]);

    // Add to train
    trainStore.updateTrainCargo(trainId, (t) => ({
      passengers: [
        ...t.passengers,
        { ...passenger, assignedTrainId: trainId, status: 'in_transit' as const, activity: 'boarding' as const, boardedAt: clock },
      ],
    }));

    currentCount++;

    eventBus.emit('passenger_boarded', {
      passengerId: passenger.id,
      trainId,
      stationId,
      passengerName: passenger.name,
      destination: passenger.destinationStationId,
    });
  }
}
