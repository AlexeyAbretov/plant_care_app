export type CareProgressTrackProps = {
  lastActionDate: string;
  intervalDays: number;
};

export type CareProgressColor = 'green' | 'yellow' | 'orange' | 'red';

export type CareProgressResult = {
  progress: number;
  percent: number;
  daysSince: number;
  color: CareProgressColor;
  overdue: boolean;
};
