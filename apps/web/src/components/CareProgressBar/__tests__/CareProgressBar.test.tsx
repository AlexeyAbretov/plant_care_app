import { describe, expect, it } from 'vitest';

import { renderUi } from '../../../test/render';
import { CareProgressTrack } from '../CareProgressBar';

describe('CareProgressTrack', () => {
  it('рисует полный, средний и пустой прогресс', () => {
    const full = renderUi(
      <CareProgressTrack intervalDays={7} lastActionDate="2026-09-22" />,
    );

    expect(full.container).toMatchSnapshot();
    full.unmount();

    const mid = renderUi(
      <CareProgressTrack intervalDays={4} lastActionDate="2026-09-20" />,
    );

    expect(mid.container).toMatchSnapshot();
    mid.unmount();

    const empty = renderUi(
      <CareProgressTrack intervalDays={0} lastActionDate="2026-09-22" />,
    );

    expect(empty.container).toMatchSnapshot();
  });
});
