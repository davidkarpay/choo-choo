/**
 * useEventListener.ts
 *
 * React hook that subscribes to simulation events from the event bus
 * and automatically cleans up on component unmount.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - events.ts: eventBus singleton
 */

import { useEffect } from 'react';
import { eventBus } from '../engine/events';
import type { SimEventType, SimEvent } from '../engine/events';

/**
 * Subscribe to a simulation event type within a React component.
 *
 * Args:
 *   type: The event type to listen for.
 *   handler: Callback invoked on each event. Should be stable (wrap in useCallback).
 *
 * Example:
 *   useEventListener('train_arrived', (e) => {
 *     console.log('Train arrived at', e.data.stationId);
 *   });
 */
export function useEventListener(
  type: SimEventType,
  handler: (event: SimEvent) => void,
): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(type, handler);
    return unsubscribe;
  }, [type, handler]);
}
