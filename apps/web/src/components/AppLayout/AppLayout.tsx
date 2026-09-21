import { Layout, Menu, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

import type { AppLayoutProps } from './AppLayout.types';

const { Header, Content } = Layout;

const HEADER_HEIGHT = 64;

export const AppLayout = ({
  children,
  headerExtra,
}: AppLayoutProps): React.JSX.Element => {
  const location = useLocation();

  const selectedKey = location.pathname.startsWith('/add') ? 'add' : 'catalog';

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
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'catalog',
              icon: <UnorderedListOutlined />,
              label: <Link to="/">Каталог</Link>,
            },
            {
              key: 'add',
              icon: <PlusOutlined />,
              label: <Link to="/add">Добавить</Link>,
            },
          ]}
          style={{ flex: 1, minWidth: 0 }}
        />
        {headerExtra !== undefined && headerExtra !== null ? (
          <div style={{ flexShrink: 0 }}>{headerExtra}</div>
        ) : null}
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
