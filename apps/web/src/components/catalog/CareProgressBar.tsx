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

  return (
    <Progress
      percent={percent}
      showInfo={false}
      size="small"
      strokeColor={getCareProgressColorHex(color)}
    />
  );
}
