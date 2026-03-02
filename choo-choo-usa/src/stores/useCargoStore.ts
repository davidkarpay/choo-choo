/**
 * useCargoStore.ts
 *
 * Zustand store for cargo shipment state. Tracks all active shipments
 * (waiting at stations or in transit on trains), delivery counts, and
 * total tonnage moved.
 *
 * Part of: Choo-Choo USA
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - zustand: state management
 *   - cargo types
 */

import { create } from 'zustand';
import type { CargoShipment } from '../types/cargo';

const MAX_ACTIVE_SHIPMENTS = 500;

interface CargoStore {
  shipments: CargoShipment[];
  deliveredCount: number;
  deliveredTons: number;

  addShipment: (shipment: CargoShipment) => void;
  loadShipment: (shipmentId: string, trainId: string, loadedAt: number) => void;
  deliverShipment: (shipmentId: string, deliveredAt: number) => void;
  getWaitingAtStation: (stationId: string) => CargoShipment[];
  getOnTrain: (trainId: string) => CargoShipment[];
  getActiveCount: () => number;
}

export const useCargoStore = create<CargoStore>((set, get) => ({
  shipments: [],
  deliveredCount: 0,
  deliveredTons: 0,

  addShipment: (shipment) =>
    set((state) => {
      if (state.shipments.length >= MAX_ACTIVE_SHIPMENTS) return state;
      return { shipments: [...state.shipments, shipment] };
    }),

  loadShipment: (shipmentId, trainId, loadedAt) =>
    set((state) => ({
      shipments: state.shipments.map((s) =>
        s.id === shipmentId
          ? { ...s, assignedTrainId: trainId, status: 'in_transit' as const, loadedAt }
          : s
      ),
    })),

  deliverShipment: (shipmentId, deliveredAt) =>
    set((state) => {
      const shipment = state.shipments.find((s) => s.id === shipmentId);
      if (!shipment) return state;
      return {
        shipments: state.shipments.filter((s) => s.id !== shipmentId),
        deliveredCount: state.deliveredCount + 1,
        deliveredTons: state.deliveredTons + shipment.quantity,
      };
    }),

  getWaitingAtStation: (stationId) =>
    get().shipments.filter(
      (s) => s.status === 'waiting' && s.originStationId === stationId
    ),

  getOnTrain: (trainId) =>
    get().shipments.filter(
      (s) => s.status === 'in_transit' && s.assignedTrainId === trainId
    ),

  getActiveCount: () => get().shipments.length,
}));
