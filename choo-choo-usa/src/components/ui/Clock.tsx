import { useSimulationStore } from '../../stores/useSimulationStore';
import { formatClockFull } from '../../utils/time';

export function Clock() {
  const clock = useSimulationStore((s) => s.clock);
  return <div className="top-bar__clock">{formatClockFull(clock)}</div>;
}
