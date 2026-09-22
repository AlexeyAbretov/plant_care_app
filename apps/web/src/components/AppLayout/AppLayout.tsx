import { Layout, Menu, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

import type { AppLayoutProps, AppNavItem } from './AppLayout.types';
import { selectedNavKey } from './AppLayout.utils';

const { Header, Content } = Layout;

const HEADER_HEIGHT = 64;

const NAV_ITEMS: AppNavItem[] = [
  {
    key: 'catalog',
    path: '/',
    icon: <UnorderedListOutlined />,
    label: 'Каталог',
  },
  {
    key: 'add',
    path: '/add',
    icon: <PlusOutlined />,
    label: 'Добавить',
  },
];

const NAV_ALIASES = [{ key: 'catalog', path: '/plants/:id/edit' }];

export const AppLayout = ({
  children,
  headerExtra,
}: AppLayoutProps): React.JSX.Element => {
  const location = useLocation();
  const selectedKey = selectedNavKey(location.pathname, [
    ...NAV_ITEMS,
    ...NAV_ALIASES,
  ]);

  return (
    <Layout style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 24,
          insetInline: 0,
          overflow: 'hidden',
          paddingInline: 24,
          position: 'fixed',
          top: 0,
          zIndex: 100,
        }}
      >
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          Уход за растениями
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={NAV_ITEMS.map(({ key, path, icon, label }) => ({
            key,
            icon,
            label: <Link to={path}>{label}</Link>,
          }))}
          style={{ flex: 1, minWidth: 0 }}
        />
        {!!headerExtra && <div style={{ flexShrink: 0 }}>{headerExtra}</div>}
      </Header>
      <Content
        style={{
          padding: 24,
          paddingTop: HEADER_HEIGHT + 24,
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};
