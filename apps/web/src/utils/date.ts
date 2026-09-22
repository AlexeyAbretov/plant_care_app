const MS_PER_DAY = 86_400_000;

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
});

const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
});

const startOfLocalDay = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

export const parseLocalDate = (value: string): Date => {
  const dateOnly = dateOnlyPattern.exec(value);

  if (dateOnly !== null) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }

  return startOfLocalDay(new Date(value));
};

export const formatIsoDate = (value: Date): string => {
  const year = String(value.getFullYear());
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const todayIsoDate = (): string => {
  return formatIsoDate(new Date());
};

export const addCalendarDays = (value: Date, days: number): Date => {
  const next = new Date(value);

  next.setDate(next.getDate() + days);

  return startOfLocalDay(next);
};

export const calendarDaysBetween = (from: Date, to: Date): number => {
  const start = startOfLocalDay(from).getTime();
  const end = startOfLocalDay(to).getTime();

  return Math.round((end - start) / MS_PER_DAY);
};

export const formatRuWeekday = (value: string): string => {
  const label = weekdayFormatter.format(parseLocalDate(value));

  return label.replace('.', '').toLocaleLowerCase('ru-RU');
};

export const formatRuDayMonth = (value: string): string => {
  return dayMonthFormatter.format(parseLocalDate(value));
};
