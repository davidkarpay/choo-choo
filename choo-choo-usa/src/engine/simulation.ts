/**
 * Master simulation tick loop.
 *
 * Runs at 10 ticks/second. Each tick advances the simulation clock,
 * updates train statuses based on time-of-day, and triggers events.
 * Phase 1 scope: drive time-of-day and train status transitions only.
 */

import { useSimulationStore } from '../stores/useSimulationStore';
import { useTrainStore } from '../stores/useTrainStore';
import { getHour } from '../utils/time';

const TICK_INTERVAL = 100; // 10 ticks per second

let tickTimer: number | null = null;
let lastTimestamp = 0;

/**
 * Determine what status trains should be in given the current hour.
 * Phase 1: trains follow a fixed daily schedule.
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

  // Update train statuses based on time-of-day
  const hour = getHour(simStore.clock);
  const expectedStatus = getExpectedStatus(hour);
  const trainStore = useTrainStore.getState();

  for (const train of trainStore.trains) {
    let transitioned = false;

    // Explicit sequential transitions (one step at a time)
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
      transitioned = true;
    } else if (train.status === 'en_route' && expectedStatus === 'returning') {
      trainStore.setTrainStatus(train.id, 'returning');
      transitioned = true;
    } else if (train.status === 'returning' && expectedStatus === 'sleeping') {
      trainStore.setTrainStatus(train.id, 'sleeping');
      transitioned = true;
    }

    // Fallback: at high speeds (e.g. 60x), large deltaMs can skip intermediate
    // states entirely (en_route jumps past returning to sleeping). Force-align
    // with the expected status when no explicit transition matched.
    if (!transitioned && train.status !== expectedStatus) {
      trainStore.setTrainStatus(train.id, expectedStatus);
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
