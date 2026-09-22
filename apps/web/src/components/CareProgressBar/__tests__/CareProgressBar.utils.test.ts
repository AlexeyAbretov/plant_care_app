import { describe, expect, it } from 'vitest';

import type { PlantLocationKind, WateringClimate } from '@types';

import { createPlant } from '../../../test/fixtures';
import {
  calculateCareProgress,
  comparePlantsByWateringDue,
  getCareProgressColor,
  getCareProgressColorHex,
  getEffectiveWateringInterval,
  getWateringDueCaption,
} from '../CareProgressBar.utils';

const climate = (overrides: Partial<WateringClimate> = {}): WateringClimate => {
  return {
    heat: false,
    heatingSeason: false,
    overcast: false,
    precipitationLikely: false,
    ...overrides,
  };
};

describe('CareProgressBar.utils', () => {
  it('красит прогресс по порогам и просрочке', () => {
    expect(getCareProgressColor(0.9, true)).toBe('red');
    expect(getCareProgressColor(0.9, false)).toBe('green');
    expect(getCareProgressColor(0.75, false)).toBe('yellow');
    expect(getCareProgressColor(0.5, false)).toBe('orange');
    expect(getCareProgressColor(0.25, false)).toBe('red');
    expect(getCareProgressColor(0, false)).toBe('red');
    expect(getCareProgressColorHex('green')).toBe('#52c41a');
    expect(getCareProgressColorHex('yellow')).toBe('#bae637');
    expect(getCareProgressColorHex('orange')).toBe('#fa8c16');
    expect(getCareProgressColorHex('red')).toBe('#ff4d4f');
  });

  it('считает прогресс, нулевой интервал и подписи срока', () => {
    expect(calculateCareProgress('2026-09-22', 4)).toMatchObject({
      color: 'green',
      daysSince: 0,
      overdue: false,
      percent: 100,
    });
    expect(calculateCareProgress('2026-09-21', 4).color).toBe('yellow');
    expect(calculateCareProgress('2026-09-20', 4).color).toBe('orange');
    expect(calculateCareProgress('2026-09-19', 4)).toMatchObject({
      color: 'red',
      percent: 25,
    });
    expect(calculateCareProgress('2026-09-18', 4)).toMatchObject({
      color: 'red',
      overdue: false,
      progress: 0,
    });
    expect(calculateCareProgress('2026-09-17', 4)).toMatchObject({
      daysSince: 5,
      overdue: true,
      progress: 0,
    });
    expect(calculateCareProgress('2026-09-22', 0)).toMatchObject({
      color: 'red',
      overdue: true,
      progress: 0,
    });

    expect(getWateringDueCaption('2026-09-22', 4, [])).toBe('через 4 дней');
    expect(getWateringDueCaption('2026-09-21', 4, [])).toBe('через 3 дней');
    expect(getWateringDueCaption('2026-09-19', 4, [])).toBe('через 1 день');
    expect(getWateringDueCaption('2026-09-18', 4, [])).toBe('полить сегодня');
    expect(getWateringDueCaption('2026-09-17', 4, [])).toBe(
      'просрочено на 1 день',
    );
    expect(getWateringDueCaption('2026-09-16', 4, [])).toBe(
      'просрочено на 2 дн.',
    );
    expect(getWateringDueCaption('2026-09-21', 4, ['heat', 'heating'])).toBe(
      'через 3 дней · жара, земля сохнет быстрее; ' +
        'отопление, воздух суше обычного',
    );
  });

  it('корректирует интервал полива погодой', () => {
    expect(getEffectiveWateringInterval(7, 'indoor', null)).toEqual({
      factor: 1,
      intervalDays: 7,
      reasons: [],
    });

    expect(
      getEffectiveWateringInterval(
        10,
        'indoor',
        climate({ heatingSeason: true }),
      ).reasons,
    ).toEqual(['heating']);
    expect(
      getEffectiveWateringInterval(10, 'outdoor', climate({ heat: true }))
        .reasons,
    ).toEqual(['heat']);
    expect(
      getEffectiveWateringInterval(10, 'indoor', climate({ overcast: true })),
    ).toMatchObject({ reasons: ['overcast'] });
    expect(
      getEffectiveWateringInterval(
        10,
        'outdoor',
        climate({ precipitationLikely: true }),
      ).reasons,
    ).toEqual(['rain']);
    expect(
      getEffectiveWateringInterval(
        10,
        'outdoor',
        climate({ overcast: true, precipitationLikely: true }),
      ).reasons,
    ).toEqual(['rain']);
    expect(
      getEffectiveWateringInterval(
        10,
        'indoor',
        climate({ heat: true, overcast: true }),
      ).reasons,
    ).toEqual(['heat']);
    expect(
      getEffectiveWateringInterval(
        10,
        'indoor',
        climate({ heatingSeason: true, overcast: true }),
      ).reasons,
    ).toEqual(['heating']);
    expect(
      getEffectiveWateringInterval(
        10,
        undefined as unknown as PlantLocationKind,
        climate({ heatingSeason: true }),
      ).reasons,
    ).toEqual(['heating']);

    const stacked = getEffectiveWateringInterval(
      10,
      'indoor',
      climate({ heat: true, heatingSeason: true }),
    );

    expect(stacked.reasons).toEqual(['heating', 'heat']);
    expect(stacked.factor).toBeCloseTo(0.595);
    expect(stacked.intervalDays).toBe(6);
  });

  it('сортирует растения по сроку полива и id', () => {
    const sooner = createPlant({
      id: 'b',
      lastWateredAt: '2026-09-01',
    });
    const later = createPlant({
      id: 'a',
      lastWateredAt: '2026-09-22',
    });
    const sameAsLater = createPlant({
      id: 'c',
      lastWateredAt: '2026-09-22',
    });

    expect(comparePlantsByWateringDue(sooner, later, null)).toBeLessThan(0);
    expect(
      comparePlantsByWateringDue(later, sooner, climate()),
    ).toBeGreaterThan(0);
    expect(comparePlantsByWateringDue(later, sameAsLater, null)).toBeLessThan(
      0,
    );
  });
});
