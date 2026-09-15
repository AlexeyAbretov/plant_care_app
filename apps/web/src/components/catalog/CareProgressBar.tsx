import { Progress, Typography } from 'antd';

import {
  calculateCareProgress,
  getCareProgressColorHex,
} from '../../utils/careProgress.js';

type CareProgressBarProps = {
  label: string;
  lastActionDate: string;
  intervalDays: number;
};

export function CareProgressBar({
  label,
  lastActionDate,
  intervalDays,
}: CareProgressBarProps): React.JSX.Element {
  const { percent, color } = calculateCareProgress(
    lastActionDate,
    intervalDays,
  );

  return (
    <div>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Progress
        percent={percent}
        showInfo={false}
        size="small"
        strokeColor={getCareProgressColorHex(color)}
      />
    </div>
  );
}
