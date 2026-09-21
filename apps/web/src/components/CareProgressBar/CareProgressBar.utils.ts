import dayjs from 'dayjs';

import type { Plant, PlantLocationKind, WateringClimate } from '@types';

import type {
  CareProgressColor,
  CareProgressResult,
  EffectiveWateringInterval,
  WateringAdjustReason,
} from './CareProgressBar.types';

const HEATING_FACTOR = 0.7;
const HEAT_FACTOR = 0.85;
const OVERCAST_FACTOR = 1.15;
const RAIN_FACTOR = 1.3;
const MIN_FACTOR = 0.5;
const MAX_FACTOR = 1.5;

const REASON_LABELS: Record<WateringAdjustReason, string> = {
  heating: 'отопление, воздух суше обычного',
  heat: 'жара, земля сохнет быстрее',
  overcast: 'пасмурно, земля сохнет медленнее',
  rain: 'осадки, можно позже',
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const calendarDaysSince = (
  lastActionDate: string,
  today = dayjs().startOf('day'),
): number => {
  const lastAction = dayjs(lastActionDate).startOf('day');

  return today.diff(lastAction, 'day');
};

export const getCareProgressColor = (
  progress: number,
  overdue: boolean,
): CareProgressColor => {
  if (overdue) {
    return 'red';
  }

  if (progress <= 0.25) {
    return 'red';
  }

  if (progress <= 0.5) {
    return 'orange';
  }

  if (progress <= 0.75) {
    return 'yellow';
  }

  return 'green';
};

export const getCareProgressColorHex = (color: CareProgressColor): string => {
  switch (color) {
    case 'green':
      return '#52c41a';
    case 'yellow':
      return '#bae637';
    case 'orange':
      return '#fa8c16';
    case 'red':
      return '#ff4d4f';
  }
};

export const calculateCareProgress = (
  lastActionDate: string,
  intervalDays: number,
): CareProgressResult => {
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
};

export const getEffectiveWateringInterval = (
  baseIntervalDays: number,
  locationKind: PlantLocationKind,
  climate: WateringClimate | null,
): EffectiveWateringInterval => {
  if (climate === null) {
    return {
      intervalDays: baseIntervalDays,
      factor: 1,
      reasons: [],
    };
  }

  const reasons: WateringAdjustReason[] = [];
  let factor = 1;
  const kind = locationKind ?? 'indoor';

  if (kind === 'indoor' && climate.heatingSeason) {
    factor *= HEATING_FACTOR;
    reasons.push('heating');
  }

  if (climate.heat) {
    factor *= HEAT_FACTOR;
    reasons.push('heat');
  }

  const stretchOvercast =
    climate.overcast &&
    !climate.heat &&
    !climate.heatingSeason &&
    !(kind === 'outdoor' && climate.precipitationLikely);

  if (stretchOvercast) {
    factor *= OVERCAST_FACTOR;
    reasons.push('overcast');
  }

  if (kind === 'outdoor' && climate.precipitationLikely) {
    factor *= RAIN_FACTOR;
    reasons.push('rain');
  }

  const clampedFactor = clamp(factor, MIN_FACTOR, MAX_FACTOR);
  const minDays = Math.max(1, Math.round(baseIntervalDays * MIN_FACTOR));
  const maxDays = Math.max(minDays, Math.round(baseIntervalDays * MAX_FACTOR));
  const intervalDays = clamp(
    Math.round(baseIntervalDays * clampedFactor),
    minDays,
    maxDays,
  );

  return {
    intervalDays,
    factor: clampedFactor,
    reasons,
  };
};

export const getWateringDueCaption = (
  lastActionDate: string,
  intervalDays: number,
  reasons: WateringAdjustReason[],
): string => {
  const { daysSince, overdue } = calculateCareProgress(
    lastActionDate,
    intervalDays,
  );
  const timing = wateringTimingLabel(daysSince, intervalDays, overdue);
  const reasonText = formatWateringReasons(reasons);

  if (reasonText === null) {
    return timing;
  }

  return `${timing} · ${reasonText}`;
};

export const comparePlantsByWateringDue = (
  left: Plant,
  right: Plant,
  climate: WateringClimate | null,
): number => {
  const leftDue = wateringDueValue(left, climate);
  const rightDue = wateringDueValue(right, climate);

  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  return left.id.localeCompare(right.id);
};

const wateringDueValue = (
  plant: Plant,
  climate: WateringClimate | null,
): number => {
  const { intervalDays } = getEffectiveWateringInterval(
    plant.wateringIntervalDays,
    plant.locationKind,
    climate,
  );

  return dayjs(plant.lastWateredAt)
    .startOf('day')
    .add(intervalDays, 'day')
    .valueOf();
};

const wateringTimingLabel = (
  daysSince: number,
  intervalDays: number,
  overdue: boolean,
): string => {
  if (overdue) {
    const lateDays = daysSince - intervalDays;

    if (lateDays === 1) {
      return 'просрочено на 1 день';
    }

    return `просрочено на ${lateDays} дн.`;
  }

  const daysUntil = intervalDays - daysSince;

  if (daysUntil <= 0) {
    return 'полить сегодня';
  }

  if (daysUntil === 1) {
    return 'через 1 день';
  }

  return `через ${daysUntil} дней`;
};

const formatWateringReasons = (
  reasons: WateringAdjustReason[],
): string | null => {
  if (reasons.length === 0) {
    return null;
  }

  return reasons.map((reason) => REASON_LABELS[reason]).join('; ');
};
