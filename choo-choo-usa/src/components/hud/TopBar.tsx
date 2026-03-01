import { useSimulationStore } from '../../stores/useSimulationStore';
import { Clock } from '../ui/Clock';
import type { SimulationSpeed } from '../../types/simulation';
import { playUIClick } from '../../utils/sound';

const SPEEDS: { label: string; value: SimulationSpeed }[] = [
  { label: '⏸', value: 0 },
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '15x', value: 15 },
  { label: '60x', value: 60 },
];

export function TopBar() {
  const speed = useSimulationStore((s) => s.speed);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  return (
    <div className="top-bar">
      <Clock />
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
