/**
 * 主布局（侧边栏 + 顶栏 + 内容区）
 */

import { Outlet } from 'react-router-dom';
import { Layout, Menu, Typography, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { moduleRegistry } from '../../../core/registry/ModuleRegistry';
import { useGlobalStore, type GlobalState } from '../../../stores/globalStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  SettingOutlined: <SettingOutlined />,
};

interface NavItem {
  path: string;
  icon?: string;
  title: string;
  order: number;
  id: string;
}

export function MainLayout() {
  const collapsed = useGlobalStore((s: GlobalState) => s.sidebarCollapsed);
  const toggleSidebar = useGlobalStore((s: GlobalState) => s.toggleSidebar);
  const wsConnected = useGlobalStore((s: GlobalState) => s.wsConnected);
  const systemStatus = useGlobalStore((s: GlobalState) => s.systemStatus);

  const navs: NavItem[] = moduleRegistry.getAllNavigation();
  const menuItems = navs.map((nav) => ({
    key: nav.path,
    icon: nav.icon ? ICON_MAP[nav.icon] : undefined,
    label: nav.title,
  }));

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleSidebar}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: collapsed ? 16 : 18,
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          {collapsed ? 'TT' : 'TimeTrack'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          items={menuItems}
          onClick={({ key }) => {
            window.location.href = key;
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              智能工时统计系统
            </Text>
          </Space>
          <Space size="large">
            <Space>
              <Badge
                status={
                  wsConnected
                    ? systemStatus === 'error'
                      ? 'error'
                      : 'success'
                    : 'default'
                }
                text={
                  wsConnected
                    ? systemStatus === 'error'
                      ? '系统异常'
                      : '运行中'
                    : '离线'
                }
              />
            </Space>
            <Text type="secondary">v1.0.0</Text>
          </Space>
        </Header>
        <Content style={{ margin: 16, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
