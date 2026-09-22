import { matchPath } from 'react-router-dom';

import type { AppNavMatcher } from './AppLayout.types';

export const selectedNavKey = (
  pathname: string,
  matchers: readonly AppNavMatcher[],
): string | undefined => {
  return matchers.find(({ path }) => matchPath(path, pathname))?.key;
};
