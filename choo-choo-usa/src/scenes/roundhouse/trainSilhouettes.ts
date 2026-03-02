/**
 * trainSilhouettes.ts
 *
 * Per-train visual configuration that maps each locomotive to a wheel
 * arrangement, body proportion, and special visual features. These configs
 * drive the drawTrain() system so each engine has a distinct silhouette.
 *
 * Wheel notation follows the Whyte classification for steam (e.g., 4-6-2
 * means 4 pilot wheels, 6 drive wheels, 2 trailing wheels). Diesel configs
 * specify axles-per-truck instead.
 *
 * Part of: Choo-Choo USA
 * See: docs/STYLE_GUIDE.md for visual guidelines
 */

export type SteamWheelConfig = {
  pilotWheels: number;     // small front wheels (0, 2, or 4)
  driveWheels: number;     // large drive wheels (4, 6, or 8)
  trailingWheels: number;  // small rear wheels (0, 2, or 4)
};

export type DieselTruckConfig = {
  axlesPerTruck: number;   // typically 2 or 3
  trucks: number;          // typically 2
};

export interface SteamSilhouette {
  kind: 'steam';
  wheels: SteamWheelConfig;
  /** Base body width before scale, in px */
  bodyWidth: number;
  /** Base body height before scale, in px */
  bodyHeight: number;
  /** Multiplier for smokestack height (1.0 = standard) */
  stackScale: number;
  /** Multiplier for boiler diameter (1.0 = standard) */
  boilerScale: number;
  /** Whether this engine has a tender car */
  hasTender: boolean;
  /** Drive wheel radius before scale, in px */
  driveWheelRadius: number;
  /** Special visual features */
  features: SteamFeature[];
}

export interface DieselSilhouette {
  kind: 'diesel';
  trucks: DieselTruckConfig;
  /** Base body width before scale, in px */
  bodyWidth: number;
  /** Base body height before scale, in px */
  bodyHeight: number;
  /** Ratio of long hood to total body (0.0-1.0) */
  longHoodRatio: number;
  /** Whether the unit has a dynamic brake blister on top */
  hasDynamicBrake: boolean;
  /** Whether this unit has a snowplow */
  hasSnowplow: boolean;
  /** Wheel radius before scale, in px */
  wheelRadius: number;
  /** Special visual features */
  features: DieselFeature[];
}

export type SteamFeature =
  | 'streamlined'     // smoother boiler top profile
  | 'articulated'     // double engine frame (extra long)
  | 'observation_dome' // glass dome on tender for scenic trains
  | 'patina';         // weathered paint effect

export type DieselFeature =
  | 'snowplow'
  | 'wide_cab'        // safety cab (wider, more windshield)
  | 'flared_radiators' // visible flared grilles
  | 'double_stack';   // tall clearance for intermodal

export type TrainSilhouette = SteamSilhouette | DieselSilhouette;

/**
 * Default steam silhouette for trains not in the lookup table.
 * Based on a classic 4-6-2 Pacific.
 */
const DEFAULT_STEAM: SteamSilhouette = {
  kind: 'steam',
  wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 2 },
  bodyWidth: 160,
  bodyHeight: 58,
  stackScale: 1.15,
  boilerScale: 1.1,
  hasTender: true,
  driveWheelRadius: 19,
  features: [],
};

/**
 * Default diesel silhouette for trains not in the lookup table.
 * Standard road switcher profile.
 */
const DEFAULT_DIESEL: DieselSilhouette = {
  kind: 'diesel',
  trucks: { axlesPerTruck: 3, trucks: 2 },
  bodyWidth: 155,
  bodyHeight: 55,
  longHoodRatio: 0.55,
  hasDynamicBrake: false,
  hasSnowplow: false,
  wheelRadius: 12,
  features: [],
};

/**
 * Per-train silhouette lookup. If a train ID is not found here,
 * falls back to DEFAULT_STEAM or DEFAULT_DIESEL based on type.
 */
export const TRAIN_SILHOUETTES: Record<string, TrainSilhouette> = {
  // === STEAM FREIGHT ===

  'big-thunder': {
    kind: 'steam',
    wheels: { pilotWheels: 2, driveWheels: 8, trailingWheels: 4 },
    bodyWidth: 190,
    bodyHeight: 65,
    stackScale: 1.3,
    boilerScale: 1.25,
    hasTender: true,
    driveWheelRadius: 21,
    features: [],
  },

  'starlight-express': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 2 },
    bodyWidth: 165,
    bodyHeight: 56,
    stackScale: 0.9,
    boilerScale: 1.0,
    hasTender: true,
    driveWheelRadius: 19,
    features: ['streamlined'],
  },

  'old-faithful': {
    kind: 'steam',
    wheels: { pilotWheels: 2, driveWheels: 8, trailingWheels: 0 },
    bodyWidth: 155,
    bodyHeight: 58,
    stackScale: 1.1,
    boilerScale: 1.05,
    hasTender: true,
    driveWheelRadius: 18,
    features: ['patina'],
  },

  'copper-king': {
    kind: 'steam',
    wheels: { pilotWheels: 2, driveWheels: 8, trailingWheels: 4 },
    bodyWidth: 210,
    bodyHeight: 65,
    stackScale: 1.2,
    boilerScale: 1.3,
    hasTender: true,
    driveWheelRadius: 20,
    features: ['articulated'],
  },

  // === STEAM PASSENGER ===

  'daisy-belle': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 4, trailingWheels: 0 },
    bodyWidth: 140,
    bodyHeight: 52,
    stackScale: 1.15,
    boilerScale: 0.9,
    hasTender: true,
    driveWheelRadius: 18,
    features: [],
  },

  'california-zephyr': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 4 },
    bodyWidth: 170,
    bodyHeight: 58,
    stackScale: 1.0,
    boilerScale: 1.05,
    hasTender: true,
    driveWheelRadius: 20,
    features: ['streamlined', 'observation_dome'],
  },

  'empire-builder': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 8, trailingWheels: 4 },
    bodyWidth: 175,
    bodyHeight: 62,
    stackScale: 1.15,
    boilerScale: 1.15,
    hasTender: true,
    driveWheelRadius: 20,
    features: [],
  },

  'southwest-chief': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 2 },
    bodyWidth: 160,
    bodyHeight: 56,
    stackScale: 1.0,
    boilerScale: 1.0,
    hasTender: true,
    driveWheelRadius: 19,
    features: ['streamlined'],
  },

  'coast-starlight': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 4 },
    bodyWidth: 170,
    bodyHeight: 58,
    stackScale: 1.0,
    boilerScale: 1.0,
    hasTender: true,
    driveWheelRadius: 20,
    features: ['streamlined'],
  },

  'city-of-nola': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 2 },
    bodyWidth: 155,
    bodyHeight: 56,
    stackScale: 1.05,
    boilerScale: 1.0,
    hasTender: true,
    driveWheelRadius: 19,
    features: [],
  },

  'silver-meteor': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 4 },
    bodyWidth: 160,
    bodyHeight: 56,
    stackScale: 0.9,
    boilerScale: 1.0,
    hasTender: true,
    driveWheelRadius: 19,
    features: ['streamlined'],
  },

  'lake-shore-ltd': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 2 },
    bodyWidth: 150,
    bodyHeight: 55,
    stackScale: 1.0,
    boilerScale: 0.95,
    hasTender: true,
    driveWheelRadius: 18,
    features: [],
  },

  'the-crescent': {
    kind: 'steam',
    wheels: { pilotWheels: 4, driveWheels: 6, trailingWheels: 4 },
    bodyWidth: 160,
    bodyHeight: 58,
    stackScale: 1.05,
    boilerScale: 1.0,
    hasTender: true,
    driveWheelRadius: 19,
    features: [],
  },

  // === DIESEL FREIGHT ===

  'iron-mike': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 2, trucks: 2 },
    bodyWidth: 110,
    bodyHeight: 48,
    longHoodRatio: 0.5,
    hasDynamicBrake: false,
    hasSnowplow: false,
    wheelRadius: 11,
    features: ['wide_cab'],
  },

  'thunder-ridge': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 165,
    bodyHeight: 58,
    longHoodRatio: 0.6,
    hasDynamicBrake: true,
    hasSnowplow: false,
    wheelRadius: 13,
    features: ['flared_radiators'],
  },

  'prairie-wind': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 155,
    bodyHeight: 55,
    longHoodRatio: 0.55,
    hasDynamicBrake: false,
    hasSnowplow: false,
    wheelRadius: 12,
    features: [],
  },

  'steel-river': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 160,
    bodyHeight: 56,
    longHoodRatio: 0.55,
    hasDynamicBrake: true,
    hasSnowplow: false,
    wheelRadius: 12,
    features: [],
  },

  'night-owl': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 165,
    bodyHeight: 58,
    longHoodRatio: 0.58,
    hasDynamicBrake: true,
    hasSnowplow: false,
    wheelRadius: 13,
    features: ['double_stack'],
  },

  'iron-horse': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 155,
    bodyHeight: 55,
    longHoodRatio: 0.55,
    hasDynamicBrake: true,
    hasSnowplow: false,
    wheelRadius: 12,
    features: [],
  },

  'gulf-runner': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 160,
    bodyHeight: 56,
    longHoodRatio: 0.55,
    hasDynamicBrake: false,
    hasSnowplow: false,
    wheelRadius: 12,
    features: [],
  },

  'timber-jack': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 2, trucks: 2 },
    bodyWidth: 135,
    bodyHeight: 50,
    longHoodRatio: 0.5,
    hasDynamicBrake: false,
    hasSnowplow: false,
    wheelRadius: 11,
    features: [],
  },

  'coal-dust': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 165,
    bodyHeight: 58,
    longHoodRatio: 0.6,
    hasDynamicBrake: true,
    hasSnowplow: false,
    wheelRadius: 13,
    features: ['flared_radiators'],
  },

  'fast-stack': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 165,
    bodyHeight: 58,
    longHoodRatio: 0.58,
    hasDynamicBrake: true,
    hasSnowplow: false,
    wheelRadius: 13,
    features: ['wide_cab', 'double_stack'],
  },

  'dixie-flyer': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 155,
    bodyHeight: 55,
    longHoodRatio: 0.55,
    hasDynamicBrake: false,
    hasSnowplow: false,
    wheelRadius: 12,
    features: [],
  },

  'northern-star': {
    kind: 'diesel',
    trucks: { axlesPerTruck: 3, trucks: 2 },
    bodyWidth: 165,
    bodyHeight: 58,
    longHoodRatio: 0.58,
    hasDynamicBrake: true,
    hasSnowplow: true,
    wheelRadius: 13,
    features: ['snowplow', 'wide_cab'],
  },
};

/**
 * Look up the silhouette config for a train, falling back to defaults.
 */
export function getSilhouette(
  trainId: string,
  trainType: 'steam' | 'diesel',
): TrainSilhouette {
  const specific = TRAIN_SILHOUETTES[trainId];
  if (specific) return specific;
  return trainType === 'steam' ? { ...DEFAULT_STEAM } : { ...DEFAULT_DIESEL };
}
