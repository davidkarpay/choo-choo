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
import type { Train } from '../types/train';
import type { Passenger } from '../types/passenger';
import type { CargoShipment } from '../types/cargo';
import type { Station } from '../types/station';

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

// ===== Phase 4: Scene-specific narrator messages =====

const ACTIVITY_PROSE: Record<string, string> = {
  reading: 'reading the morning newspaper',
  sleeping: 'dozing, hat over eyes',
  eating: 'enjoying a warm meal',
  talking: 'chatting with a fellow traveler',
  looking_out_window: 'watching the countryside roll past',
  waiting: 'checking a pocket watch',
  boarding: 'climbing aboard',
};

function describeActivity(activity: string): string {
  return ACTIVITY_PROSE[activity] ?? 'settling in for the ride';
}

/**
 * Generate narrator intro text for the train interior scene.
 *
 * Args:
 *   train: The train being viewed.
 *   passengers: Passengers currently aboard.
 *   cargo: Cargo shipments currently loaded.
 *   stationLookup: Lookup function to resolve station IDs to names.
 *
 * Returns:
 *   A warm, storybook-voiced paragraph.
 */
export function narrateTrainInterior(
  train: Train,
  passengers: Passenger[],
  cargo: CargoShipment[],
  stationLookup: (id: string) => string,
): string {
  const templates = [
    () => {
      const p1 = passengers[0];
      const p2 = passengers[1];
      const pDesc = p1 ? `${p1.name} is ${describeActivity(p1.activity)}.` : '';
      const p2Desc = p2 ? ` ${p2.name} is ${describeActivity(p2.activity)}.` : '';
      const cargoDesc = cargo.length > 0
        ? ` In the cargo cars, ${cargo.length} shipments rumble along for the ride.`
        : '';
      return `Inside ${train.name}, the day passes gently. ${pDesc}${p2Desc}${cargoDesc} And up front, the engineer keeps one hand on the throttle and one eye on the tracks ahead.`;
    },
    () => {
      const pCount = passengers.length;
      const cargoTons = cargo.reduce((sum, c) => sum + c.quantity, 0);
      const dest = cargo[0] ? stationLookup(cargo[0].destinationStationId) : 'the next station';
      return `${train.name} rolls on, carrying ${pCount} ${pCount === 1 ? 'soul' : 'souls'} and ${cargoTons > 0 ? `${cargoTons} tons of cargo bound for ${dest}` : 'an empty hold waiting to be filled'}. The wheels sing their steady rhythm on the rails.`;
    },
    () => {
      const p1 = passengers[0];
      const pDesc = p1 ? `${p1.name} is ${describeActivity(p1.activity)} in the coach.` : 'The coaches are quiet today.';
      return `Welcome aboard ${train.name}! ${pDesc} The landscape outside the windows is a painting that never stops changing.`;
    },
    () => {
      const speed = train.speedMph;
      const p1 = passengers[0];
      const pDesc = p1 ? ` In the passenger car, ${p1.name} is ${describeActivity(p1.activity)}.` : '';
      return `At ${speed} miles an hour, ${train.name} makes the world blur past the windows.${pDesc} The gentle rocking of the cars could lull anyone to sleep.`;
    },
  ];

  return pick(templates)();
}

/**
 * Generate narrator intro text for the station scene.
 *
 * Args:
 *   station: The station being viewed.
 *   waitingPassengers: Passengers waiting on the platform.
 *   waitingCargo: Cargo waiting for pickup.
 *   trainsAtStation: Train IDs currently at the station.
 *   clock: Current simulation clock (total minutes).
 *
 * Returns:
 *   A warm, storybook-voiced paragraph.
 */
export function narrateStation(
  station: Station,
  waitingPassengers: Passenger[],
  waitingCargo: CargoShipment[],
  trainsAtStation: string[],
  clock: number,
): string {
  const timeOfDay = clock % 1440;
  const isMorning = timeOfDay >= 360 && timeOfDay < 720;
  const isEvening = timeOfDay >= 1020 && timeOfDay < 1320;

  const sizeDesc = station.size === 'major_hub'
    ? 'the busiest crossroads in the land'
    : station.size === 'regional'
    ? 'a fine station with a proud history'
    : 'a quiet little stop along the line';

  const templates = [
    () => {
      const pCount = waitingPassengers.length;
      const trainDesc = trainsAtStation.length > 0
        ? `A train sits at the platform, steam curling from its stack.`
        : `The tracks are empty for now, but a distant whistle promises company soon.`;
      const waitDesc = pCount > 0
        ? `${pCount} ${pCount === 1 ? 'traveler waits' : 'travelers wait'} on the platform.`
        : 'The platform is peaceful and still.';
      return `Welcome to ${station.name}, ${station.city} -- ${sizeDesc}. ${trainDesc} ${waitDesc}`;
    },
    () => {
      const greeting = isMorning ? 'Good morning' : isEvening ? 'Good evening' : 'Welcome';
      const cargoCount = waitingCargo.length;
      const cargoDesc = cargoCount > 0
        ? `${cargoCount} ${cargoCount === 1 ? 'shipment waits' : 'shipments wait'} on the loading dock.`
        : '';
      const p1 = waitingPassengers[0];
      const pDesc = p1
        ? `On the platform, ${p1.name} waits with ${p1.appearance.bagType !== 'none' ? 'a ' + p1.appearance.bagType.replace('_', ' ') : 'a hopeful look'}.`
        : '';
      return `${greeting} from ${station.name}! ${pDesc} ${cargoDesc}`;
    },
    () => {
      const industries = station.industries.map((i) => i.name).join(' and ');
      const industryDesc = industries
        ? `The town thrives on ${industries}.`
        : `It is a place where people come and go, each with a story to tell.`;
      return `${station.name} stands proud in ${station.city}, ${station.state}. ${industryDesc} Trains have been stopping here for as long as anyone can remember.`;
    },
  ];

  return pick(templates)();
}
