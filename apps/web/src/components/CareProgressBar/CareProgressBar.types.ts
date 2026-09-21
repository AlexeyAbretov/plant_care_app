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

export type WateringAdjustReason = 'heating' | 'heat' | 'overcast' | 'rain';

export type EffectiveWateringInterval = {
  intervalDays: number;
  factor: number;
  reasons: WateringAdjustReason[];
};
