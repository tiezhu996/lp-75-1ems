import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Table, message, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { Environment, EnvVariable } from '../types';
import {
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  activateEnvironment,
} from '../api/environments';

const { Text } = Typography;

interface EnvironmentModalProps {
  visible: boolean;
  onClose: () => void;
  activeEnvironment: Environment | null;
  onRefresh: () => void;
}

const EnvironmentModal = ({ visible, onClose, onRefresh }: EnvironmentModalProps) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [form] = Form.useForm();
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchEnvironments();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setEditingEnvId(null);
      form.resetFields();
    }
  }, [visible, form]);

  const fetchEnvironments = async () => {
    try {
      const data = await getEnvironments();
      setEnvironments(data);
    } catch {
    }
  };

  const handleEditEnvironment = (env: Environment) => {
    setEditingEnvId(env._id);
    form.setFieldsValue({
      name: env.name,
      variables: env.variables || [],
    });
  };

  const handleActivateEnvironment = async (id: string) => {
    try {
      await activateEnvironment(id);
      message.success('切换成功');
      onRefresh();
    } catch {
    }
  };

  const handleDeleteEnvironment = async (id: string) => {
    try {
      await deleteEnvironment(id);
      message.success('删除成功');
      onRefresh();
    } catch {
    }
  };

  const handleSaveEnvironment = async (values: { name: string; variables: EnvVariable[] }) => {
    try {
      setSaving(true);
      if (editingEnvId) {
        await updateEnvironment(editingEnvId, values);
        message.success('更新成功');
      } else {
        await createEnvironment(values);
        message.success('创建成功');
      }
      setEditingEnvId(null);
      form.resetFields();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = () => {
    setEditingEnvId(null);
    form.resetFields();
  };



  return (
    <Modal
      title="环境变量"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <div style={{ display: 'flex', gap: 16, height: 500 }}>
        <div style={{ width: 200, borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>环境列表</Text>
            <Button type="text" icon={<PlusOutlined />} onClick={handleAddNew} />
          </div>
          <div style={{ maxHeight: 450, overflow: 'auto' }}>
            {environments.length === 0 ? (
              <Text type="secondary">暂无环境</Text>
            ) : (
              environments.map((env) => (
                <div
                  key={env._id}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: editingEnvId === env._id ? '#e6f7ff' : 'transparent',
                    borderRadius: 4,
                    marginBottom: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() => handleEditEnvironment(env)}
                >
                  <span>
                    {env.isActive && <CheckOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
                    {env.name}
                  </span>
                  <Space size="small">
                    {!env.isActive && (
                      <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateEnvironment(env._id);
                        }}
                      >
                        激活
                      </Button>
                    )}
                    <Popconfirm
                      title="确认删除？"
                      onConfirm={() => handleDeleteEnvironment(env._id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Space>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveEnvironment}
            initialValues={{ variables: [] }}
          >
            <Form.Item
              name="name"
              label="环境名称"
              rules={[{ required: true, message: '请输入环境名称' }]}
            >
              <Input placeholder="如：开发环境" />
            </Form.Item>

            <Form.List name="variables">
              {(fields, { add, remove }) => (
                <>
                  <Table
                    dataSource={fields.map((field) => ({
                      ...field,
                      key: field.key,
                    }))}
                    pagination={false}
                    size="small"
                  >
                    <Table.Column
                      title="变量名"
                      dataIndex="key"
                      key="key"
                      width="40%"
                      render={(_: unknown, record: { key: number; name: [number] }) => (
                        <Form.Item
                          name={[record.name[0], 'key']}
                          rules={[{ required: true, message: '请输入变量名' }]}
                          style={{ margin: 0 }}
                        >
                          <Input placeholder="如：base_url" size="small" />
                        </Form.Item>
                      )}
                    />
                    <Table.Column
                      title="值"
                      dataIndex="value"
                      key="value"
                      width="50%"
                      render={(_: unknown, record: { key: number; name: [number] }) => (
                        <Form.Item
                          name={[record.name[0], 'value']}
                          style={{ margin: 0 }}
                        >
                          <Input placeholder="变量值" size="small" />
                        </Form.Item>
                      )}
                    />
                    <Table.Column
                      title="操作"
                      key="action"
                      width="10%"
                      render={(_: unknown, record: { key: number }) => (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(record.key)}
                        />
                      )}
                    />
                  </Table>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: 8 }}
                  >
                    添加变量
                  </Button>
                </>
              )}
            </Form.List>

            <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
              <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onClose}>关闭</Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default EnvironmentModal;
