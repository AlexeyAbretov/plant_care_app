import dayjs from 'dayjs';

export type CareProgressColor = 'green' | 'yellow' | 'red';

export interface CareProgressResult {
  progress: number;
  percent: number;
  daysSince: number;
  color: CareProgressColor;
  overdue: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calendarDaysSince(
  lastActionDate: string,
  today = dayjs().startOf('day'),
): number {
  const lastAction = dayjs(lastActionDate).startOf('day');

  return today.diff(lastAction, 'day');
}

export function getCareProgressColor(
  progress: number,
  overdue: boolean,
): CareProgressColor {
  if (overdue || progress < 0.2) {
    return 'red';
  }

  if (progress <= 0.5) {
    return 'yellow';
  }

  return 'green';
}

export function getCareProgressColorHex(color: CareProgressColor): string {
  switch (color) {
    case 'green':
      return '#52c41a';
    case 'yellow':
      return '#faad14';
    case 'red':
      return '#ff4d4f';
  }
}

export function calculateCareProgress(
  lastActionDate: string,
  intervalDays: number,
): CareProgressResult {
  const daysSince = calendarDaysSince(lastActionDate);

  if (intervalDays <= 0) {
    return {
      progress: 0,
      percent: 0,
      daysSince,
      color: 'red',
      overdue: true,
    };
  }

  const progress = clamp(1 - daysSince / intervalDays, 0, 1);
  const overdue = daysSince > intervalDays;

  return {
    progress,
    percent: Math.round(progress * 100),
    daysSince,
    color: getCareProgressColor(progress, overdue),
    overdue,
  };
}
