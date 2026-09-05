/**
 * 主布局（侧边栏 + 顶栏 + 内容区）
 */

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Tooltip, Typography, Space, Badge, message } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { moduleRegistry } from '../../../core/registry/ModuleRegistry';
import { useGlobalStore, type GlobalState } from '../../../stores/globalStore';
import { copyTraceId } from '../../../core/trace';

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
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useGlobalStore((s: GlobalState) => s.sidebarCollapsed);
  const toggleSidebar = useGlobalStore((s: GlobalState) => s.toggleSidebar);
  const wsConnected = useGlobalStore((s: GlobalState) => s.wsConnected);
  const systemStatus = useGlobalStore((s: GlobalState) => s.systemStatus);

  const navs: NavItem[] = moduleRegistry.getAllNavigation();
  const lastTraceId = useGlobalStore((s: GlobalState) => s.lastTraceId);
  const menuItems = navs.map((nav) => ({
    key: nav.path,
    icon: nav.icon ? ICON_MAP[nav.icon] : undefined,
    label: nav.title,
  }));

  /** 点击 trace 文字：复制到剪贴板 */
  const handleCopyTrace = async () => {
    if (!lastTraceId) return;
    const ok = await copyTraceId(lastTraceId);
    message[ok ? 'success' : 'error'](
      ok ? `已复制 Trace ID：${lastTraceId}` : '复制失败，请手动复制',
    );
  };

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
          selectedKeys={[
            navs.find(
              (nav) =>
                location.pathname === nav.path ||
                location.pathname.startsWith(`${nav.path}/`),
            )?.path ?? '/dashboard',
          ]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
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
            <Tooltip
              title={lastTraceId ? '点击复制 Trace ID' : '尚无接口请求'}
              placement="bottom"
            >
              <Text
                type="secondary"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  cursor: lastTraceId ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
                onClick={handleCopyTrace}
              >
                🔖 {lastTraceId || '————————'}
              </Text>
            </Tooltip>
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
