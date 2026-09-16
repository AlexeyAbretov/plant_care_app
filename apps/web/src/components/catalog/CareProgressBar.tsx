import { Progress } from 'antd';

import {
  calculateCareProgress,
  getCareProgressColorHex,
} from '../../utils/careProgress.js';

type CareProgressTrackProps = {
  lastActionDate: string;
  intervalDays: number;
};

export function CareProgressTrack({
  lastActionDate,
  intervalDays,
}: CareProgressTrackProps): React.JSX.Element {
  const { percent, color } = calculateCareProgress(
    lastActionDate,
    intervalDays,
  );
  const strokeColor = getCareProgressColorHex(color);

  return (
    <Progress
      percent={percent}
      showInfo={false}
      size="small"
      strokeColor={strokeColor}
      trailColor={percent === 0 ? strokeColor : undefined}
    />
  );
}
