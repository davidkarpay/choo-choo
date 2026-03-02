/**
 * DetailTooltip.tsx
 *
 * Shared click-to-inspect tooltip for passengers and cargo in both
 * train interior and station scenes. Small Panel positioned near the
 * clicked element.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: /docs/STYLE_GUIDE.md for panel design
 *
 * Dependencies:
 *   - framer-motion: AnimatePresence
 *   - Panel: storybook-styled panel
 *   - passenger/cargo types
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Passenger } from '../../types/passenger';
import type { CargoShipment } from '../../types/cargo';
import { useStationStore } from '../../stores/useStationStore';

interface DetailTooltipProps {
  data: Passenger | CargoShipment | { role: string } | null;
  type: 'passenger' | 'cargo' | 'worker' | null;
  position: { x: number; y: number };
  onClose: () => void;
}

function stationName(id: string): string {
  const station = useStationStore.getState().getStationById(id);
  if (station) return `${station.name}, ${station.city}`;
  return id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const ACTIVITY_LABELS: Record<string, string> = {
  waiting: 'Waiting for the train',
  boarding: 'Climbing aboard',
  sleeping: 'Taking a nap',
  eating: 'Enjoying a meal',
  reading: 'Reading',
  talking: 'Chatting',
  looking_out_window: 'Watching the scenery',
  arriving: 'Arriving',
  deboarding: 'Stepping off',
  leaving: 'On their way',
};

const MOOD_LABELS: Record<string, string> = {
  happy: 'Happy',
  tired: 'Tired',
  excited: 'Excited',
  nervous: 'A little nervous',
};

const WORKER_DESCRIPTIONS: Record<string, string> = {
  engineer: 'The engineer keeps a steady hand on the throttle and watches the tracks ahead.',
  fireman: 'The fireman shovels coal and tends the fire that drives the engine.',
  conductor: 'The conductor keeps the schedule and makes sure every passenger is aboard.',
  porter: 'The porter helps travelers with their luggage and finds them a good seat.',
  cook: 'The cook prepares hot meals in the tiny galley kitchen.',
  waiter: 'The waiter carries trays of food and drinks through the swaying cars.',
  ticket_collector: 'The ticket collector punches each ticket with a satisfying click.',
};

export function DetailTooltip({ data, type, position, onClose }: DetailTooltipProps) {
  if (!data || !type) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="detail-tooltip"
        style={{
          left: Math.min(position.x, window.innerWidth - 280),
          top: Math.min(position.y - 10, window.innerHeight - 200),
        }}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 5 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="detail-tooltip__close"
          onClick={onClose}
          aria-label="Close tooltip"
        >
          ✕
        </button>
        {type === 'passenger' && renderPassenger(data as Passenger)}
        {type === 'cargo' && renderCargo(data as CargoShipment)}
        {type === 'worker' && renderWorker(data as { role: string })}
      </motion.div>
    </AnimatePresence>
  );
}

function renderPassenger(p: Passenger) {
  return (
    <div className="detail-tooltip__content">
      <div className="detail-tooltip__name">{p.name}</div>
      <div className="detail-tooltip__stat">
        <span>Journey</span>
        <span>{stationName(p.originStationId)} → {stationName(p.destinationStationId)}</span>
      </div>
      <div className="detail-tooltip__stat">
        <span>Activity</span>
        <span>{ACTIVITY_LABELS[p.activity] ?? p.activity}</span>
      </div>
      <div className="detail-tooltip__stat">
        <span>Mood</span>
        <span>{MOOD_LABELS[p.mood] ?? p.mood}</span>
      </div>
    </div>
  );
}

function renderCargo(c: CargoShipment) {
  return (
    <div className="detail-tooltip__content">
      <div className="detail-tooltip__name">{c.type.charAt(0).toUpperCase() + c.type.slice(1)}</div>
      <div className="detail-tooltip__stat">
        <span>Quantity</span>
        <span>{c.quantity} {c.unit}</span>
      </div>
      <div className="detail-tooltip__stat">
        <span>Route</span>
        <span>{stationName(c.originStationId)} → {stationName(c.destinationStationId)}</span>
      </div>
      <div className="detail-tooltip__stat">
        <span>From</span>
        <span>{c.industrySource}</span>
      </div>
    </div>
  );
}

function renderWorker(w: { role: string }) {
  const role = w.role;
  const title = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
  return (
    <div className="detail-tooltip__content">
      <div className="detail-tooltip__name">{title}</div>
      <p className="detail-tooltip__desc">
        {WORKER_DESCRIPTIONS[role] ?? `The ${role} keeps the railroad running.`}
      </p>
    </div>
  );
}
