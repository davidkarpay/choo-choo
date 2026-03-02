/**
 * TopBar.tsx
 *
 * HUD overlay with simulation clock, speed controls, and navigation.
 * Appears at the top of every scene.
 *
 * Part of: Choo-Choo USA
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { Clock } from '../ui/Clock';
import type { SimulationSpeed } from '../../types/simulation';
import { playUIClick } from '../../utils/sound';

const SPEEDS: { label: string; value: SimulationSpeed }[] = [
  { label: '\u23F8', value: 0 },
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '15x', value: 15 },
  { label: '60x', value: 60 },
];

interface TopBarProps {
  /** If true, show "View Map" button. Defaults to true. */
  showMapButton?: boolean;
}

export function TopBar({ showMapButton = true }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const speed = useSimulationStore((s) => s.speed);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  const isInteriorRoute = location.pathname.startsWith('/station/') || location.pathname.startsWith('/train/');

  return (
    <div className="top-bar">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isInteriorRoute && (
          <button
            className="speed-btn"
            onClick={() => {
              playUIClick();
              navigate('/map');
            }}
            style={{
              background: 'var(--warm-brick)',
              color: 'var(--cream-parchment)',
              border: '2px solid var(--ink-black)',
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            Return to Map
          </button>
        )}
        {showMapButton && !isInteriorRoute && (
          <button
            className="speed-btn"
            onClick={() => {
              playUIClick();
              navigate('/map');
            }}
            style={{
              background: 'var(--cream-parchment)',
              color: 'var(--ink-black)',
              border: '2px solid var(--ink-black)',
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            View Map
          </button>
        )}
        <Clock />
      </div>
      <div className="top-bar__controls">
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            className={`speed-btn ${speed === s.value ? 'speed-btn--active' : ''}`}
            onClick={() => {
              playUIClick();
              setSpeed(s.value);
            }}
            aria-label={s.value === 0 ? 'Pause simulation' : `Set speed to ${s.label}`}
            aria-pressed={speed === s.value}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
