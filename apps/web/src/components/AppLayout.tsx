import { Layout, Menu, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  const location = useLocation();

  const selectedKey = location.pathname.startsWith('/add') ? 'add' : 'catalog';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
      </Header>
      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}
