export type AppLayoutProps = {
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
};

export type AppNavItem = {
  key: string;
  path: string;
  icon: React.ReactNode;
  label: string;
};

export type AppNavMatcher = {
  key: string;
  path: string;
};
