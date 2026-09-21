import { Progress } from 'antd';

import type { CareProgressTrackProps } from './CareProgressBar.types';
import {
  calculateCareProgress,
  getCareProgressColorHex,
} from './CareProgressBar.utils';

export const CareProgressTrack = ({
  lastActionDate,
  intervalDays,
}: CareProgressTrackProps): React.JSX.Element => {
  const { percent, color } = calculateCareProgress(
    lastActionDate,
    intervalDays,
  );
  const strokeColor = getCareProgressColorHex(color);

  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      <Progress
        percent={percent}
        showInfo={false}
        size="small"
        strokeColor={strokeColor}
        style={{ width: '100%' }}
        trailColor={percent === 0 ? strokeColor : undefined}
      />
    </div>
  );
};
