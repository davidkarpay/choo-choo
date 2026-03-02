/**
 * persistence.ts
 *
 * Save and restore game state to IndexedDB via Dexie. Serializes all
 * Zustand stores into a single JSON snapshot. Auto-save runs every 30
 * seconds while the simulation is active.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - db.ts: Dexie database
 *   - all Zustand stores
 */

import { db } from '../stores/db';
import { useSimulationStore } from '../stores/useSimulationStore';
import { useTrainStore } from '../stores/useTrainStore';
import { useCargoStore } from '../stores/useCargoStore';
import { usePassengerStore } from '../stores/usePassengerStore';
import { useStatsStore } from '../stores/useStatsStore';

const SAVE_KEY = 'autosave';
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds

let autosaveTimer: number | null = null;

interface GameSnapshot {
  version: 1;
  savedAt: number;
  simulation: {
    clock: number;
    speed: number;
  };
  trains: ReturnType<typeof useTrainStore.getState>['trains'];
  cargo: {
    shipments: ReturnType<typeof useCargoStore.getState>['shipments'];
    deliveredCount: number;
    deliveredTons: number;
  };
  passengers: {
    passengers: ReturnType<typeof usePassengerStore.getState>['passengers'];
    arrivedCount: number;
  };
  stats: {
    today: ReturnType<typeof useStatsStore.getState>['today'];
    allTime: ReturnType<typeof useStatsStore.getState>['allTime'];
  };
}

/**
 * Serialize all game state into a snapshot and write to IndexedDB.
 */
export async function saveGameState(): Promise<void> {
  const simState = useSimulationStore.getState();
  const trainState = useTrainStore.getState();
  const cargoState = useCargoStore.getState();
  const passengerState = usePassengerStore.getState();
  const statsState = useStatsStore.getState();

  const snapshot: GameSnapshot = {
    version: 1,
    savedAt: Date.now(),
    simulation: {
      clock: simState.clock,
      speed: simState.speed,
    },
    trains: trainState.trains,
    cargo: {
      shipments: cargoState.shipments,
      deliveredCount: cargoState.deliveredCount,
      deliveredTons: cargoState.deliveredTons,
    },
    passengers: {
      passengers: passengerState.passengers,
      arrivedCount: passengerState.arrivedCount,
    },
    stats: {
      today: statsState.today,
      allTime: statsState.allTime,
    },
  };

  await db.saves.put({
    id: SAVE_KEY,
    savedAt: snapshot.savedAt,
    data: JSON.stringify(snapshot),
  });
}

/**
 * Load game state from IndexedDB and restore all stores.
 *
 * Returns:
 *   True if a saved game was found and restored, false otherwise.
 */
export async function loadGameState(): Promise<boolean> {
  const record = await db.saves.get(SAVE_KEY);
  if (!record) return false;

  try {
    const snapshot: GameSnapshot = JSON.parse(record.data);
    if (snapshot.version !== 1) return false;

    // Restore simulation clock
    useSimulationStore.getState().setClock(snapshot.simulation.clock);
    useSimulationStore.getState().setSpeed(snapshot.simulation.speed as any);

    // Restore trains
    useTrainStore.setState({ trains: snapshot.trains });

    // Restore cargo
    useCargoStore.setState({
      shipments: snapshot.cargo.shipments,
      deliveredCount: snapshot.cargo.deliveredCount,
      deliveredTons: snapshot.cargo.deliveredTons,
    });

    // Restore passengers
    usePassengerStore.setState({
      passengers: snapshot.passengers.passengers,
      arrivedCount: snapshot.passengers.arrivedCount,
    });

    // Restore stats
    useStatsStore.setState({
      today: snapshot.stats.today,
      allTime: snapshot.stats.allTime,
    });

    return true;
  } catch (err) {
    console.error('[Persistence] Failed to load game state:', err);
    return false;
  }
}

/**
 * Check if a saved game exists in IndexedDB.
 */
export async function hasSavedGame(): Promise<boolean> {
  const record = await db.saves.get(SAVE_KEY);
  return record != null;
}

/**
 * Delete the saved game from IndexedDB.
 */
export async function clearGameState(): Promise<void> {
  await db.saves.delete(SAVE_KEY);
}

/**
 * Start auto-saving every 30 seconds.
 */
export function startAutoSave(): void {
  if (autosaveTimer !== null) return;
  autosaveTimer = window.setInterval(() => {
    saveGameState().catch((err) =>
      console.error('[Persistence] Autosave failed:', err)
    );
  }, AUTOSAVE_INTERVAL);
}

/**
 * Stop auto-saving.
 */
export function stopAutoSave(): void {
  if (autosaveTimer !== null) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}
