/**
 * events.ts
 *
 * Typed publish/subscribe event bus for decoupling simulation events
 * from UI, sound, and narrator systems. Events are emitted by the
 * simulation tick loop and consumed by React hooks, sound triggers,
 * and the stats tracker.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - None (standalone module)
 */

export type SimEventType =
  | 'train_departed'
  | 'train_arrived'
  | 'cargo_loaded'
  | 'cargo_delivered'
  | 'passenger_boarded'
  | 'passenger_arrived'
  | 'new_day';

export interface SimEvent {
  type: SimEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

type EventHandler = (event: SimEvent) => void;

const MAX_LOG_SIZE = 50;

class EventBus {
  private handlers = new Map<SimEventType, Set<EventHandler>>();
  private log: SimEvent[] = [];

  /**
   * Subscribe to an event type.
   *
   * Args:
   *   type: The event type to listen for.
   *   handler: Callback invoked when the event fires.
   *
   * Returns:
   *   Unsubscribe function.
   */
  on(type: SimEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  /** Remove a specific handler for an event type. */
  off(type: SimEventType, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  /**
   * Emit an event to all subscribers of its type.
   *
   * Args:
   *   type: The event type.
   *   data: Arbitrary payload for the event.
   */
  emit(type: SimEventType, data: Record<string, unknown> = {}): void {
    const event: SimEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    // Append to rolling log
    this.log.push(event);
    if (this.log.length > MAX_LOG_SIZE) {
      this.log.shift();
    }

    // Notify all handlers
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Handler error for ${type}:`, err);
        }
      }
    }
  }

  /** Get the rolling event log (most recent 50 events). */
  getLog(): readonly SimEvent[] {
    return this.log;
  }

  /** Clear all handlers (for testing). */
  clear(): void {
    this.handlers.clear();
    this.log = [];
  }
}

/** Singleton event bus for the entire application. */
export const eventBus = new EventBus();
