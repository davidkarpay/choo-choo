/**
 * cargoTransfer.ts
 *
 * Handles loading and unloading cargo when a train stops at a station.
 * First unloads cargo destined for this station, then loads waiting
 * cargo that matches the train's capabilities and available capacity.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - useCargoStore: shipment state
 *   - useTrainStore: train cargo manifest
 *   - useStationStore: waiting cargo queue
 *   - cargoCapacity: capacity calculations
 *   - events: event bus
 */

import { useCargoStore } from '../stores/useCargoStore';
import { useTrainStore } from '../stores/useTrainStore';
import { useStationStore } from '../stores/useStationStore';
import { availableCars, carsRequired } from './cargoCapacity';
import { eventBus } from './events';
import type { Train } from '../types/train';

/**
 * Process all cargo operations when a train arrives at a station.
 *
 * Step 1: Unload cargo destined for this station (delivered).
 * Step 2: Load waiting cargo that this train can carry.
 *
 * Args:
 *   trainId: The train stopped at the station.
 *   stationId: The station where the train is dwelling.
 *   clock: Current simulation time in minutes.
 */
export function processCargoAtStation(
  trainId: string,
  stationId: string,
  clock: number,
): void {
  const cargoStore = useCargoStore.getState();
  const trainStore = useTrainStore.getState();
  const stationStore = useStationStore.getState();

  const train = trainStore.getTrainById(trainId);
  if (!train) return;

  // Step 1: Unload cargo destined for this station
  const onTrain = cargoStore.getOnTrain(trainId);
  const toUnload = onTrain.filter((s) => s.destinationStationId === stationId);

  for (const shipment of toUnload) {
    cargoStore.deliverShipment(shipment.id, clock);
    eventBus.emit('cargo_delivered', {
      shipmentId: shipment.id,
      trainId,
      stationId,
      cargoType: shipment.type,
      quantity: shipment.quantity,
    });
  }

  // Remove delivered cargo from train manifest
  if (toUnload.length > 0) {
    trainStore.updateTrainCargo(trainId, (t) => ({
      cargoManifest: t.cargoManifest.filter(
        (s) => s.destinationStationId !== stationId || s.status !== 'in_transit'
      ),
    }));
  }

  // Step 2: Load waiting cargo
  // Re-fetch train after unloading to get updated capacity
  const updatedTrain = trainStore.getTrainById(trainId);
  if (!updatedTrain) return;

  const waitingCargo = cargoStore.getWaitingAtStation(stationId);
  let freeCars = availableCars(updatedTrain);

  for (const shipment of waitingCargo) {
    if (freeCars <= 0) break;

    // Train must be capable of carrying this cargo type
    if (!updatedTrain.cargoCapability.includes(shipment.type)) continue;

    const neededCars = carsRequired(shipment.type, shipment.quantity);
    if (neededCars > freeCars) continue;

    // Load it
    cargoStore.loadShipment(shipment.id, trainId, clock);
    stationStore.removeWaitingCargo(stationId, shipment.id);

    // Add to train manifest
    trainStore.updateTrainCargo(trainId, (t) => ({
      cargoManifest: [
        ...t.cargoManifest,
        { ...shipment, assignedTrainId: trainId, status: 'in_transit' as const, loadedAt: clock },
      ],
    }));

    freeCars -= neededCars;

    eventBus.emit('cargo_loaded', {
      shipmentId: shipment.id,
      trainId,
      stationId,
      cargoType: shipment.type,
      quantity: shipment.quantity,
    });
  }
}
