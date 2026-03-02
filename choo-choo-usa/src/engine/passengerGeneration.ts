/**
 * passengerGeneration.ts
 *
 * Spawns passengers at stations once per simulated hour. Larger stations
 * generate more passengers. Each passenger has a random name, appearance,
 * and destination reachable by the rail network.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - useStationStore: station data
 *   - usePassengerStore: passenger state
 *   - useRouteStore: route data for destination reachability
 *   - passengers.json: name lists
 */

import { useStationStore } from '../stores/useStationStore';
import { usePassengerStore } from '../stores/usePassengerStore';
import { useRouteStore } from '../stores/useRouteStore';
import { useNetworkStore } from '../stores/useNetworkStore';
import passengerNames from '../../data/passengers.json';
import type { Passenger, AgeGroup, PassengerAppearance, PassengerActivity } from '../types/passenger';
import type { Station } from '../types/station';
import { getHour } from '../utils/time';

let nextPassengerId = 1;

function makePassengerId(): string {
  return `pax-${nextPassengerId++}`;
}

const CLOTHING_COLORS = ['#C45B3E', '#5B98B5', '#2D5A3D', '#D4A843', '#8C6E4A', '#7B4F9D', '#E8913A'];
const HAIR_STYLES: PassengerAppearance['hairStyle'][] = ['short', 'long', 'bald', 'hat'];
const HAT_TYPES: PassengerAppearance['hatType'][] = ['none', 'none', 'none', 'conductor', 'cowboy', 'beanie', 'sun_hat'];
const BAG_TYPES: PassengerAppearance['bagType'][] = ['suitcase', 'backpack', 'briefcase', 'bundle', 'none'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge(): AgeGroup {
  const r = Math.random();
  if (r < 0.25) return 'child';
  if (r < 0.8) return 'adult';
  return 'elderly';
}

function randomAppearance(age: AgeGroup): PassengerAppearance {
  return {
    bodyType: age,
    clothingColor: pick(CLOTHING_COLORS),
    hairStyle: pick(HAIR_STYLES),
    hatType: pick(HAT_TYPES),
    bagType: pick(BAG_TYPES),
  };
}

function randomName(): string {
  return `${pick(passengerNames.firstNames)} ${pick(passengerNames.lastNames)}`;
}

/**
 * Find a destination station reachable from the origin via the network.
 * Uses the network graph for full reachability (including multi-hop
 * via junctions), falling back to same-route lookup if graph unavailable.
 *
 * Args:
 *   originStationId: Where the passenger is waiting.
 *   allStations: All stations in the system.
 *
 * Returns:
 *   Destination station ID, or null if isolated.
 */
function findReachableDestination(originStationId: string, allStations: Station[]): string | null {
  const networkStore = useNetworkStore.getState();

  // Use network graph if available (Phase 5)
  if (networkStore.initialized) {
    const reachable = networkStore.getReachableStations(originStationId);
    if (reachable.size === 0) return null;
    const candidates = [...reachable];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Fallback: same-route reachability
  const routes = useRouteStore.getState().routes;
  const reachable = new Set<string>();

  for (const route of routes) {
    if (route.stationIds.includes(originStationId)) {
      for (const sid of route.stationIds) {
        if (sid !== originStationId) reachable.add(sid);
      }
    }
  }

  if (reachable.size === 0) return null;
  const candidates = [...reachable];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Generation rate by station size (chance per hour per station). */
const GENERATION_RATE: Record<string, number> = {
  major_hub: 0.6,
  regional: 0.4,
  local: 0.2,
};

/**
 * Generate passengers at all stations. Called once per sim-hour.
 *
 * Args:
 *   clock: Current simulation clock (minutes).
 */
export function generatePassengers(clock: number): void {
  const stationStore = useStationStore.getState();
  const passengerStore = usePassengerStore.getState();

  if (passengerStore.getActiveCount() >= 300) return;

  // Only generate during daytime hours (6 AM - 10 PM)
  const hour = getHour(clock);
  if (hour < 6 || hour >= 22) return;

  for (const station of stationStore.stations) {
    const rate = GENERATION_RATE[station.size] ?? 0.2;
    if (Math.random() > rate) continue;

    // Generate 1-3 passengers per batch
    const count = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      if (passengerStore.getActiveCount() >= 300) return;

      const destinationId = findReachableDestination(station.id, stationStore.stations);
      if (!destinationId) continue;

      const ageGroup = randomAge();
      const passenger: Passenger = {
        id: makePassengerId(),
        name: randomName(),
        ageGroup,
        appearance: randomAppearance(ageGroup),
        originStationId: station.id,
        destinationStationId: destinationId,
        assignedTrainId: null,
        activity: 'waiting',
        mood: 'happy',
        status: 'waiting',
        createdAt: clock,
        boardedAt: null,
        arrivedAt: null,
      };

      passengerStore.addPassenger(passenger);
      stationStore.addWaitingPassengers(station.id, [passenger.id]);
    }
  }
}

/** Time-of-day activity weights. */
const ACTIVITIES_BY_TIME: Record<string, PassengerActivity[]> = {
  morning: ['reading', 'eating', 'looking_out_window', 'talking'],
  midday: ['eating', 'reading', 'talking', 'looking_out_window'],
  afternoon: ['reading', 'looking_out_window', 'talking', 'sleeping'],
  evening: ['sleeping', 'reading', 'looking_out_window'],
  night: ['sleeping', 'sleeping', 'reading'],
};

/**
 * Update activities for all in-transit passengers based on time of day.
 * Called every 10 simulated minutes.
 *
 * Args:
 *   clock: Current simulation clock (minutes).
 */
export function updatePassengerActivities(clock: number): void {
  const passengerStore = usePassengerStore.getState();
  const hour = getHour(clock);

  let period: string;
  if (hour >= 6 && hour < 11) period = 'morning';
  else if (hour >= 11 && hour < 14) period = 'midday';
  else if (hour >= 14 && hour < 18) period = 'afternoon';
  else if (hour >= 18 && hour < 22) period = 'evening';
  else period = 'night';

  const activities = ACTIVITIES_BY_TIME[period] ?? ['sleeping'];

  for (const passenger of passengerStore.passengers) {
    if (passenger.status !== 'in_transit') continue;
    // Random chance to change activity
    if (Math.random() < 0.3) {
      const newActivity = pick(activities);
      passengerStore.updateActivity(passenger.id, newActivity);
    }
  }
}
