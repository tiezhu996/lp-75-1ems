import { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Avatar, Dropdown, Space, Tag } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Collection, Environment, Header as HeaderType, HttpMethod } from '../types';
import { getCollections } from '../api/collections';
import { getEnvironments } from '../api/environments';
import { getUser } from '../utils/auth';
import { clearAuthData } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import RequestPanel from '../components/RequestPanel';
import EnvironmentModal from '../components/EnvironmentModal';
import HistoryModal from '../components/HistoryModal';

const { Header } = Layout;
const { Title } = Typography;

interface InitialConfig {
  method: HttpMethod;
  url: string;
  headers: HeaderType[];
  body?: string;
}

const Workspace = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [environmentModalVisible, setEnvironmentModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);
  const [initialConfig, setInitialConfig] = useState<InitialConfig | null>(null);
  const user = getUser();

  const fetchCollections = useCallback(async () => {
    try {
      const data = await getCollections();
      setCollections(data);
    } catch {
    }
  }, []);

  const fetchEnvironments = useCallback(async () => {
    try {
      const data = await getEnvironments();
      const active = data.find((env) => env.isActive) || null;
      setActiveEnvironment(active);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchEnvironments();
  }, [fetchCollections, fetchEnvironments]);

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const handleRefreshAll = () => {
    fetchCollections();
    fetchEnvironments();
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          zIndex: 10,
        }}
      >
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            API Debugger
          </Title>
          {activeEnvironment && (
            <Tag color="green">环境: {activeEnvironment.name}</Tag>
          )}
        </Space>
        <Space>
          <Dropdown menu={{ items: userMenuItems }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <span>{user?.username}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sidebar
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          onOpenHistory={() => setHistoryModalVisible(true)}
          onOpenEnvironments={() => setEnvironmentModalVisible(true)}
          onRefreshCollections={fetchCollections}
        />
        <RequestPanel
          collectionId={selectedCollectionId}
          collections={collections}
          activeEnvironment={activeEnvironment}
          initialConfig={initialConfig}
        />
      </Layout>

      <EnvironmentModal
        visible={environmentModalVisible}
        onClose={() => {
          setEnvironmentModalVisible(false);
          handleRefreshAll();
        }}
        activeEnvironment={activeEnvironment}
        onRefresh={fetchEnvironments}
      />

      <HistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        onRestore={(config) => {
          setInitialConfig(null);
          setTimeout(() => setInitialConfig(config), 0);
        }}
      />
    </Layout>
  );
};

export default Workspace;
