import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, FolderOpenOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import { Collection } from '../types';
import { createCollection, deleteCollection, updateCollection } from '../api/collections';

const { Sider } = Layout;

interface SidebarProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (id: string) => void;
  onOpenHistory: () => void;
  onOpenEnvironments: () => void;
  onRefreshCollections: () => void;
}

const Sidebar = ({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onOpenHistory,
  onOpenEnvironments,
}: SidebarProps) => {
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionForm] = Form.useForm();
  const [collectionModalLoading, setCollectionModalLoading] = useState(false);

  useEffect(() => {
    if (!collectionModalVisible) {
      setEditingCollection(null);
      collectionForm.resetFields();
    }
  }, [collectionModalVisible, collectionForm]);

  const handleOpenCollectionModal = (collection?: Collection) => {
    setEditingCollection(collection || null);
    if (collection) {
      collectionForm.setFieldsValue({
        name: collection.name,
        description: collection.description || '',
      });
    }
    setCollectionModalVisible(true);
  };

  const handleSaveCollection = async (values: { name: string; description?: string }) => {
    try {
      setCollectionModalLoading(true);
      if (editingCollection) {
        await updateCollection(editingCollection._id, values);
        message.success('更新成功');
      } else {
        await createCollection(values);
        message.success('创建成功');
      }
      setCollectionModalVisible(false);
      collectionForm.resetFields();
    } catch {
    } finally {
      setCollectionModalLoading(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      message.success('删除成功');
    } catch {
    }
  };

  return (
    <Sider width={280} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 16 }}>集合</span>
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={() => handleOpenCollectionModal()}
        />
      </div>

      <div style={{ padding: '8px', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {collections.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
            暂无集合，点击右上角 + 新建
          </div>
        ) : (
          <Menu mode="inline" selectedKeys={selectedCollectionId ? [selectedCollectionId] : []}>
            {collections.map((collection) => (
              <Menu.Item
                key={collection._id}
                icon={<FolderOpenOutlined />}
                onClick={() => onSelectCollection(collection._id)}
                style={{ display: 'flex', alignItems: 'center' }}
                extra={
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCollectionModal(collection);
                      }}
                    />
                    <Popconfirm
                      title="确认删除此集合？"
                      onConfirm={() => handleDeleteCollection(collection._id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Space>
                }
              >
                {collection.name}
              </Menu.Item>
            ))}
          </Menu>
        )}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px' }}>
        <Menu mode="inline">
          <Menu.Item
            icon={<HistoryOutlined />}
            onClick={onOpenHistory}
          >
            请求历史
          </Menu.Item>
          <Menu.Item
            icon={<SettingOutlined />}
            onClick={onOpenEnvironments}
          >
            环境变量
          </Menu.Item>
        </Menu>
      </div>

      <Modal
        title={editingCollection ? '编辑集合' : '新建集合'}
        open={collectionModalVisible}
        onCancel={() => setCollectionModalVisible(false)}
        footer={null}
      >
        <Form form={collectionForm} layout="vertical" onFinish={handleSaveCollection}>
          <Form.Item
            name="name"
            label="集合名称"
            rules={[{ required: true, message: '请输入集合名称' }]}
          >
            <Input placeholder="请输入集合名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCollectionModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={collectionModalLoading}>
                {editingCollection ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Sider>
  );
};

export default Sidebar;
