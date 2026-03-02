/**
 * DepartureBoard.tsx
 *
 * Chalk-on-wood styled departure board showing upcoming trains at a station.
 * Updates reactively from simulation state.
 *
 * Part of: Choo-Choo USA — Phase 4
 * See: specs/PHASE_4_INTERIORS.md for design reference
 *
 * Dependencies:
 *   - departureSchedule: schedule computation
 *   - framer-motion: entry animation
 */

import { motion } from 'framer-motion';
import { getDeparturesForStation, formatScheduleTime } from '../../utils/departureSchedule';
import { useSimulationStore } from '../../stores/useSimulationStore';

interface DepartureBoardProps {
  stationId: string;
}

export function DepartureBoard({ stationId }: DepartureBoardProps) {
  // Subscribe to clock to re-render on time changes
  const clock = useSimulationStore((s) => s.clock);
  const entries = getDeparturesForStation(stationId);

  // Show max 5 entries
  const visible = entries.slice(0, 5);

  return (
    <motion.div
      className="departure-board"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="departure-board__title">DEPARTURES</div>
      <div className="departure-board__header">
        <span>Train</span>
        <span>Destination</span>
        <span>Time</span>
        <span>Status</span>
      </div>
      <div className="departure-board__divider" />
      {visible.length === 0 && (
        <div className="departure-board__empty">No trains scheduled</div>
      )}
      {visible.map((entry) => (
        <div
          key={entry.trainId}
          className={`departure-board__row ${
            entry.status === 'BOARDING' ? 'departure-board__row--boarding' : ''
          } ${entry.status === 'DELAYED' ? 'departure-board__row--delayed' : ''}`}
        >
          <span className="departure-board__train">{entry.trainName}</span>
          <span className="departure-board__dest">{entry.destination}</span>
          <span className="departure-board__time">{formatScheduleTime(entry.estimatedTime)}</span>
          <span className="departure-board__status">{entry.status}</span>
        </div>
      ))}
    </motion.div>
  );
}
