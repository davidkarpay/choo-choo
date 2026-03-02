import { useNavigate } from 'react-router-dom';
import { Panel } from './Panel';
import { playUIClick } from '../../utils/sound';
import type { Train } from '../../types/train';

interface TrainDetailProps {
  train: Train | null;
  onClose: () => void;
}

function getStatusLabel(status: string, trainType: 'steam' | 'diesel'): string {
  switch (status) {
    case 'sleeping': return 'Sleeping in the roundhouse';
    case 'warming_up': return trainType === 'steam' ? 'Warming up the boiler' : 'Warming up the engine';
    case 'departing': return 'Departing the roundhouse';
    case 'en_route': return 'Out on the rails';
    case 'arriving': return 'Arriving at station';
    case 'at_station': return 'Stopped at station';
    case 'returning': return 'Returning home';
    case 'maintenance': return 'Under maintenance';
    default: return status;
  }
}

export function TrainDetail({ train, onClose }: TrainDetailProps) {
  const navigate = useNavigate();

  if (!train) return null;

  return (
    <div className="train-detail">
      <Panel title="" onClose={onClose}>
        <div
          className="train-detail__color-bar"
          style={{ backgroundColor: train.color.primary }}
        />
        <div className="train-detail__name">{train.name}</div>
        <p className="train-detail__personality">{train.personality}</p>

        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Status</span>
          <span className="train-detail__stat-value">
            {getStatusLabel(train.status, train.type)}
          </span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Type</span>
          <span className="train-detail__stat-value">
            {train.type === 'steam' ? 'Steam Engine' : 'Diesel Engine'}
          </span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Top Speed</span>
          <span className="train-detail__stat-value">{train.speedMph} mph</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Max Cars</span>
          <span className="train-detail__stat-value">{train.maxCars}</span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Cargo Types</span>
          <span className="train-detail__stat-value">
            {train.cargoCapability.join(', ')}
          </span>
        </div>
        <div className="train-detail__stat">
          <span className="train-detail__stat-label">Miles Traveled</span>
          <span className="train-detail__stat-value">
            {train.stats.totalMiles.toLocaleString()}
          </span>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn--primary"
            onClick={() => {
              playUIClick();
              navigate(`/train/${train.id}`);
            }}
            style={{ fontSize: '0.8rem', padding: '6px 14px', width: '100%' }}
          >
            Look Inside
          </button>
        </div>
      </Panel>
    </div>
  );
}
