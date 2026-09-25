import { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { setAuthData } from '../utils/auth';

const { Title } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginForm>();

  const handleLogin = async (values: LoginForm) => {
    try {
      setLoading(true);
      const result = await login(values);
      setAuthData(result.token, result.user);
      message.success('登录成功');
      navigate('/');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: LoginForm) => {
    try {
      setLoading(true);
      const result = await register(values);
      setAuthData(result.token, result.user);
      message.success('注册成功');
      navigate('/');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loginItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        initialValues={{ username: 'dev1', password: 'dev123' }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            登录
          </Button>
        </Form.Item>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          测试账号: dev1 / dev123 或 dev2 / dev123
        </Typography.Paragraph>
      </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form form={form} layout="vertical" onFinish={handleRegister}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, max: 50, message: '用户名长度必须在 2-50 个字符之间' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少 6 个字符' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            注册
          </Button>
        </Form.Item>
      </Form>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>API Debugger</Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            在线 API 调试平台
          </Typography.Paragraph>
        </div>
        <Tabs defaultActiveKey="login" items={loginItems} centered />
      </Card>
    </div>
  );
};

export default LoginPage;
