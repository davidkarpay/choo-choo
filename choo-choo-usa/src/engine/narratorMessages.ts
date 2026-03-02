/**
 * narratorMessages.ts
 *
 * Converts simulation events into warm, storybook-voiced narrator text.
 * Each event type has multiple template variations to keep the narration
 * feeling fresh and alive.
 *
 * Part of: Choo-Choo USA
 * See: /docs/STORY.md for narrative voice guidelines
 *
 * Dependencies:
 *   - None (pure data)
 */

import type { SimEvent } from './events';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ARRIVED_TEMPLATES = [
  (train: string, station: string) => `${train} has pulled into ${station}. The platform comes alive!`,
  (train: string, station: string) => `All aboard! ${train} has arrived at ${station}.`,
  (train: string, station: string) => `The whistle echoes across ${station} -- ${train} is here!`,
  (train: string, station: string) => `${train} rolls to a gentle stop at ${station}.`,
];

const DEPARTED_TEMPLATES = [
  (train: string) => `${train} pulls away from the station, gaining speed with each mighty chug.`,
  (train: string) => `With a long whistle blast, ${train} is back on the rails!`,
  (train: string) => `The wheels begin to turn -- ${train} is off again!`,
];

const CARGO_DELIVERED_TEMPLATES = [
  (type: string, qty: number, station: string) => `${qty} tons of ${type} delivered to ${station}. Another job well done!`,
  (type: string, qty: number, station: string) => `The ${type} has arrived! ${qty} tons safely delivered to ${station}.`,
  (type: string, qty: number) => `That's ${qty} more tons of ${type} keeping America running.`,
];

const CARGO_LOADED_TEMPLATES = [
  (type: string, station: string) => `Loading ${type} at ${station}... the crane swings and the cars fill up!`,
  (type: string) => `More ${type} loaded up. The train grows heavier and stronger.`,
];

const PASSENGER_BOARDED_TEMPLATES = [
  (name: string, dest: string) => `${name} steps aboard, ticket in hand, heading to ${dest}.`,
  (name: string) => `${name} finds a window seat and settles in for the ride.`,
];

const PASSENGER_ARRIVED_TEMPLATES = [
  (name: string, station: string) => `${name} has arrived at ${station}! A happy wave from the platform.`,
  (name: string) => `${name} steps off the train with a smile. Journey complete!`,
];

const NEW_DAY_TEMPLATES = [
  (day: number) => `Day ${day} dawns over the railroad. What adventures will today bring?`,
  (day: number) => `The sun peeks over the horizon. It's Day ${day}, and the rails are ready.`,
  (day: number) => `Good morning! Day ${day} begins, and the whole railroad stretches and yawns awake.`,
];

/**
 * Generate a narrator message for a simulation event.
 *
 * Args:
 *   event: The simulation event to narrate.
 *
 * Returns:
 *   A warm, storybook-voiced string, or null if the event doesn't need narration.
 */
export function narrateEvent(event: SimEvent): string | null {
  switch (event.type) {
    case 'train_arrived': {
      const train = (event.data.trainId as string) ?? 'A train';
      const station = (event.data.stationName as string) ?? 'the station';
      // Capitalize train name
      const trainName = train.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return pick(ARRIVED_TEMPLATES)(trainName, station);
    }
    case 'train_departed': {
      const train = (event.data.trainId as string) ?? 'A train';
      const trainName = train.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return pick(DEPARTED_TEMPLATES)(trainName);
    }
    case 'cargo_delivered': {
      const type = (event.data.cargoType as string) ?? 'cargo';
      const qty = (event.data.quantity as number) ?? 0;
      const station = (event.data.stationId as string) ?? 'the station';
      return pick(CARGO_DELIVERED_TEMPLATES)(type, qty, station);
    }
    case 'cargo_loaded': {
      const type = (event.data.cargoType as string) ?? 'cargo';
      const station = (event.data.stationId as string) ?? 'the station';
      return pick(CARGO_LOADED_TEMPLATES)(type, station);
    }
    case 'passenger_boarded': {
      const name = (event.data.passengerName as string) ?? 'A traveler';
      const dest = (event.data.destination as string) ?? 'their destination';
      return pick(PASSENGER_BOARDED_TEMPLATES)(name, dest);
    }
    case 'passenger_arrived': {
      const name = (event.data.passengerName as string) ?? 'A traveler';
      const station = (event.data.stationId as string) ?? 'the station';
      return pick(PASSENGER_ARRIVED_TEMPLATES)(name, station);
    }
    case 'new_day': {
      const day = (event.data.dayNumber as number) ?? 1;
      return pick(NEW_DAY_TEMPLATES)(day);
    }
    default:
      return null;
  }
}
