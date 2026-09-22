import { describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  calendarDaysBetween,
  formatIsoDate,
  formatRuDayMonth,
  formatRuWeekday,
  parseLocalDate,
  todayIsoDate,
} from '../date';

describe('date', () => {
  it('фиксирует календарный день для стабильных снапшотов', () => {
    expect(todayIsoDate()).toBe('2026-09-22');
    expect(new Date()).toBeInstanceOf(Date);
  });

  it('разбирает дату без времени и отбрасывает время у ISO', () => {
    const dateOnly = parseLocalDate('2026-09-22');

    expect(dateOnly.getFullYear()).toBe(2026);
    expect(dateOnly.getMonth()).toBe(8);
    expect(dateOnly.getDate()).toBe(22);

    const withTime = parseLocalDate('2026-01-03T23:30:00');

    expect(formatIsoDate(withTime)).toBe('2026-01-03');
  });

  it('форматирует локальную дату с ведущими нулями', () => {
    expect(formatIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('сдвигает дату на календарные дни и считает разницу', () => {
    const start = parseLocalDate('2026-09-22');
    const next = addCalendarDays(start, 10);
    const previous = addCalendarDays(start, -2);

    expect(formatIsoDate(next)).toBe('2026-10-02');
    expect(formatIsoDate(previous)).toBe('2026-09-20');
    expect(calendarDaysBetween(previous, next)).toBe(12);
    expect(
      calendarDaysBetween(
        new Date(2026, 8, 22, 23, 0, 0),
        new Date(2026, 8, 23, 1, 0, 0),
      ),
    ).toBe(1);
  });

  it('форматирует день недели и день с месяцем по-русски', () => {
    expect(formatRuWeekday('2026-09-22')).toBe('вт');
    expect(formatRuDayMonth('2026-09-22')).toBe('22.09');
  });
});
