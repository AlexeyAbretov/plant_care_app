import { describe, expect, it } from 'vitest';

import { selectedNavKey } from '../AppLayout.utils';

describe('selectedNavKey', () => {
  const matchers = [
    { key: 'catalog', path: '/' },
    { key: 'add', path: '/add' },
    { key: 'catalog', path: '/plants/:id/edit' },
  ];

  it('находит пункт меню и возвращает undefined без совпадения', () => {
    expect(selectedNavKey('/', matchers)).toBe('catalog');
    expect(selectedNavKey('/add', matchers)).toBe('add');
    expect(selectedNavKey('/plants/plant-1/edit', matchers)).toBe('catalog');
    expect(selectedNavKey('/missing', matchers)).toBeUndefined();
  });
});
