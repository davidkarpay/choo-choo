/**
 * db.ts
 *
 * Dexie.js database schema for IndexedDB persistence. Stores serialized
 * game state snapshots that can be restored on page reload.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - dexie: IndexedDB wrapper
 */

import Dexie, { type Table } from 'dexie';

export interface SaveRecord {
  id: string;
  savedAt: number;
  data: string; // JSON-serialized game state
}

class ChooChooDB extends Dexie {
  saves!: Table<SaveRecord, string>;

  constructor() {
    super('choo-choo-usa');
    this.version(1).stores({
      saves: 'id',
    });
  }
}

export const db = new ChooChooDB();
