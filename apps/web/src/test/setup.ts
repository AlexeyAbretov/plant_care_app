import '@ant-design/v5-patch-for-react-19';
import '@testing-library/jest-dom/vitest';

import { message } from 'antd';
import { afterEach, expect } from 'vitest';

import { prettyDOM } from '@testing-library/dom';
import { cleanup } from '@testing-library/react';

const RealDate = globalThis.Date;
const frozenTime = new RealDate(2026, 8, 22, 12, 0, 0).getTime();

class FrozenDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) {
      super(frozenTime);
    } else {
      super(...(args as [string]));
    }
  }
}

globalThis.Date = FrozenDate as unknown as DateConstructor;

const ID_ATTRS = new Set([
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-labelledby',
  'aria-owns',
  'for',
  'id',
]);

const MOTION_CLASS =
  /\bant-[\w-]*?(?:appear|enter|leave)(?:-(?:start|active|prepare))?\b/g;

const normalizeTree = (element: Element): void => {
  for (const attr of [...element.attributes]) {
    if (ID_ATTRS.has(attr.name)) {
      element.setAttribute(attr.name, 'id');
    }

    if (attr.name === 'class') {
      const next = attr.value
        .replace(MOTION_CLASS, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (next === '') {
        element.removeAttribute('class');
      } else {
        element.setAttribute('class', next);
      }
    }

    if (attr.name === 'style' && attr.value.includes('transition')) {
      const next = attr.value.replace(/transition:\s*none;?\s*/g, '').trim();

      if (next === '') {
        element.removeAttribute('style');
      } else {
        element.setAttribute('style', next);
      }
    }
  }

  for (const child of element.children) {
    normalizeTree(child);
  }
};

expect.addSnapshotSerializer({
  test: (value: unknown): boolean => value instanceof HTMLElement,
  serialize: (value: unknown): string => {
    const clone = (value as HTMLElement).cloneNode(true) as HTMLElement;

    normalizeTree(clone);

    const html = prettyDOM(clone, Number.POSITIVE_INFINITY, {
      highlight: false,
    });

    return typeof html === 'string' ? html : '';
  },
});

const realGetComputedStyle = window.getComputedStyle.bind(window);

window.getComputedStyle = ((element: Element) => {
  return realGetComputedStyle(element);
}) as typeof window.getComputedStyle;

Object.defineProperty(window, 'innerWidth', {
  configurable: true,
  value: 1024,
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string): MediaQueryList => {
    return {
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      get matches() {
        return window.innerWidth >= 768;
      },
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    } as MediaQueryList;
  },
  writable: true,
});

class ResizeObserverStub {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

window.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;

HTMLElement.prototype.setPointerCapture = () => {};

HTMLElement.prototype.releasePointerCapture = () => {};

Element.prototype.scrollIntoView = () => {};

URL.createObjectURL = () => 'blob:preview';
URL.revokeObjectURL = () => {};

afterEach(() => {
  cleanup();
  message.destroy();
  localStorage.clear();
  window.innerWidth = 1024;
});
