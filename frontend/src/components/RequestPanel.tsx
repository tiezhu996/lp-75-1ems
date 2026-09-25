import { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Card,
  Select,
  Input,
  Button,
  Tabs,
  Table,
  message,
  Tag,
  Space,
  Typography,
  Empty,
  Popconfirm,
  Alert,
  Badge,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  Collection,
  ApiEndpoint,
  HttpMethod,
  Header,
  Param,
  Environment,
  ProxyResponse,
} from '../types';
import {
  getEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from '../api/endpoints';
import { sendRequest } from '../api/proxy';
import { replaceEnvVariables } from '../utils/environment';
import { tryFormatJson, isValidJson } from '../utils/json';
import {
  parseUrl,
  buildUrl,
  mergeParams,
  findDuplicateKeys,
} from '../utils/queryParams';

const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const methodColors: Record<string, string> = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#f97316',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
  HEAD: '#06b6d4',
  OPTIONS: '#ec4899',
};

interface RequestPanelProps {
  collectionId: string | null;
  collections: Collection[];
  activeEnvironment: Environment | null;
  initialConfig?: {
    method: HttpMethod;
    url: string;
    headers: Header[];
    params?: Param[];
    body?: string;
  } | null;
}

const RequestPanel = ({
  collectionId,
  activeEnvironment,
  initialConfig,
}: RequestPanelProps) => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([]);
  const [params, setParams] = useState<Param[]>([]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [endpointName, setEndpointName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // 表格是查询参数的唯一权威来源：表格变化时用当前地址的 base 部分重建地址
  const applyParamsChange = (newParams: Param[], currentUrl: string) => {
    setParams(newParams);
    const { base, fragment } = parseUrl(currentUrl);
    setUrl(buildUrl(base, newParams, fragment));
  };

  // 地址栏输入：查询内容自动落到参数表；地址文本保持用户输入原样，
  // 发送时仍以参数表为准重建，避免同名参数重复发送
  const handleUrlChange = (text: string) => {
    const parsed = parseUrl(text);
    if (parsed.params.length > 0) {
      setParams((prev) => mergeParams(prev, parsed.params));
    }
    setUrl(text);
  };

  // 加载一份完整请求配置（选择接口、恢复历史记录）：
  // 优先使用保存的参数表，否则从地址中解析
  const loadRequestConfig = (config: {
    method: HttpMethod;
    url: string;
    headers: Header[];
    params?: Param[];
    body?: string;
  }) => {
    setMethod(config.method);
    const parsed = parseUrl(config.url);
    const table = config.params ?? parsed.params;
    setParams(table);
    setUrl(buildUrl(parsed.base, table, parsed.fragment));
    setHeaders(config.headers);
    setBody(config.body || '');
  };

  useEffect(() => {
    if (collectionId) {
      fetchEndpoints(collectionId);
    } else {
      setEndpoints([]);
    }
    setSelectedEndpoint(null);
  }, [collectionId]);

  useEffect(() => {
    if (initialConfig) {
      loadRequestConfig(initialConfig);
      setSelectedEndpoint(null);
    }
  }, [initialConfig]);

  const fetchEndpoints = async (id: string) => {
    try {
      const data = await getEndpoints(id);
      setEndpoints(data);
    } catch {
    }
  };

  const handleSelectEndpoint = useCallback((endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    loadRequestConfig({
      method: endpoint.method,
      url: endpoint.url,
      headers: endpoint.headers || [],
      params: endpoint.params,
      body: endpoint.body,
    });
    setResponse(null);
  }, []);

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  };

  const handleUpdateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers];
    if (newHeaders[index]) {
      newHeaders[index][field] = value as never;
      setHeaders(newHeaders);
    }
  };

  const handleAddParam = () => {
    applyParamsChange([...params, { key: '', value: '', enabled: true }], url);
  };

  const handleRemoveParam = (index: number) => {
    const newParams = [...params];
    newParams.splice(index, 1);
    applyParamsChange(newParams, url);
  };

  const handleUpdateParam = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newParams = [...params];
    if (newParams[index]) {
      newParams[index][field] = value as never;
      applyParamsChange(newParams, url);
    }
  };

  const handleFormatBody = () => {
    setBody(tryFormatJson(body));
  };

  const resetForm = () => {
    setMethod('GET');
    setUrl('');
    setHeaders([]);
    setParams([]);
    setBody('');
    setResponse(null);
    setSelectedEndpoint(null);
    setShowNameInput(false);
    setEndpointName('');
  };

  const handleSend = async () => {
    // 发送时以参数表为准重建地址：地址里手写的查询内容已被参数表接管，
    // 同名参数只取第一次出现的值，不会重复发送
    const { base, fragment } = parseUrl(url);
    const finalUrl = buildUrl(base, params, fragment);

    if (!base.trim()) {
      message.error('请输入请求 URL');
      return;
    }

    try {
      setSending(true);
      const resolvedUrl = replaceEnvVariables(finalUrl, activeEnvironment);

      const result = await sendRequest({
        method,
        url: resolvedUrl,
        headers,
        params,
        body,
      });

      setResponse(result);
      message.success('请求完成');
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleSaveEndpoint = async () => {
    if (!collectionId) {
      message.error('请先选择一个集合');
      return;
    }

    if (!endpointName.trim()) {
      setShowNameInput(true);
      return;
    }

    try {
      setSaving(true);
      if (selectedEndpoint) {
        await updateEndpoint(selectedEndpoint._id, {
          name: endpointName,
          method,
          url,
          headers,
          params,
          body,
        });
        message.success('更新成功');
      } else {
        await createEndpoint({
          collectionId,
          name: endpointName,
          method,
          url,
          headers,
          params,
          body,
        });
        message.success('保存成功');
      }
      await fetchEndpoints(collectionId);
      setShowNameInput(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEndpoint = async () => {
    if (!selectedEndpoint) return;

    try {
      await deleteEndpoint(selectedEndpoint._id);
      message.success('删除成功');
      resetForm();
      if (collectionId) {
        await fetchEndpoints(collectionId);
      }
    } catch {
    }
  };

  const headerColumns = [
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 60,
      render: (enabled: boolean, record: { index: number; enabled: boolean; key: number; value: string }) => (
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleUpdateHeader(record.index, 'enabled', e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: '35%',
      render: (key: string, record: { index: number; enabled: boolean; key: number; value: string }) => (
        <Input
          placeholder="Header Key"
          value={key}
          onChange={(e) => handleUpdateHeader(record.index, 'key', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (value: string, record: { index: number; enabled: boolean; key: number; value: string }) => (
        <Input
          placeholder="Header Value"
          value={value}
          onChange={(e) => handleUpdateHeader(record.index, 'value', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_: unknown, record: { index: number }) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveHeader(record.index)}
        />
      ),
    },
  ];

  const duplicateKeys = findDuplicateKeys(params);
  // 同名参数第一次出现的行号，用于高亮后续重复行
  const firstOccurrence = new Map<string, number>();
  params.forEach((param, index) => {
    const key = param.key.trim();
    if (key && !firstOccurrence.has(key)) {
      firstOccurrence.set(key, index);
    }
  });

  interface ParamRow {
    index: number;
    enabled: boolean;
    name: string;
    value: string;
  }

  const paramColumns = [
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 60,
      render: (enabled: boolean, record: ParamRow) => (
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleUpdateParam(record.index, 'enabled', e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
      render: (name: string, record: ParamRow) => (
        <Input
          placeholder="参数名"
          value={name}
          status={duplicateKeys.includes(name.trim()) ? 'warning' : ''}
          onChange={(e) => handleUpdateParam(record.index, 'key', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '参数值',
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (value: string, record: ParamRow) => (
        <Input
          placeholder="参数值"
          value={value}
          onChange={(e) => handleUpdateParam(record.index, 'value', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_: unknown, record: ParamRow) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveParam(record.index)}
        />
      ),
    },
  ];

  const responseTabItems = [
    {
      key: 'body',
      label: 'Body',
      children: response ? (
        <div style={{ height: 300 }}>
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={response.body}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              wordWrap: 'on',
            }}
          />
        </div>
      ) : (
        <Empty description="发送请求后查看响应" style={{ padding: 48 }} />
      ),
    },
    {
      key: 'headers',
      label: 'Headers',
      children: response ? (
        <Table
          dataSource={Object.entries(response.headers).map(([key, value]) => ({
            key,
            value,
          }))}
          columns={[
            { title: 'Name', dataIndex: 'key', key: 'key' },
            { title: 'Value', dataIndex: 'value', key: 'value' },
          ]}
          pagination={false}
          size="small"
        />
      ) : (
        <Empty description="发送请求后查看响应头" style={{ padding: 48 }} />
      ),
    },
  ];

  const requestTabItems = [
    {
      key: 'params',
      label: (
        <Space size={4}>
          Params
          {duplicateKeys.length > 0 && (
            <Badge count={duplicateKeys.length} size="small" title="存在重复参数名" />
          )}
        </Space>
      ),
      children: (
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              地址栏中的查询参数会自动同步到下表；发送时以表中勾选的参数为准，未勾选的不发送。
            </Text>
          </div>
          {duplicateKeys.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 8 }}
              message={`参数名 ${duplicateKeys
                .map((key) => `"${key}"`)
                .join('、')} 重复，发送时将使用第一次出现的值`}
            />
          )}
          <Table
            columns={paramColumns}
            dataSource={params.map((p, i) => ({
              index: i,
              enabled: p.enabled,
              name: p.key,
              value: p.value,
            }))}
            rowKey="index"
            pagination={false}
            size="small"
            locale={{ emptyText: '暂无参数，点击下方按钮添加' }}
            onRow={(record: ParamRow) => ({
              style:
                record.name.trim() &&
                duplicateKeys.includes(record.name.trim()) &&
                firstOccurrence.get(record.name.trim()) !== record.index
                  ? { background: '#fffbe6' }
                  : {},
            })}
          />
          <Button
            type="dashed"
            onClick={handleAddParam}
            block
            icon={<PlusOutlined />}
            style={{ marginTop: 8 }}
          >
            添加参数
          </Button>
        </div>
      ),
    },
    {
      key: 'headers',
      label: 'Headers',
      children: (
        <div style={{ padding: 16 }}>
          <Table
            columns={headerColumns}
            dataSource={headers.map((h, i) => ({ ...h, index: i, key: i }))}
            pagination={false}
            size="small"
            locale={{ emptyText: '暂无 Headers，点击下方按钮添加' }}
          />
          <Button
            type="dashed"
            onClick={handleAddHeader}
            block
            icon={<PlusOutlined />}
            style={{ marginTop: 8 }}
          >
            添加 Header
          </Button>
        </div>
      ),
    },
    {
      key: 'body',
      label: 'Body',
      children: (
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={handleFormatBody}
              disabled={!isValidJson(body)}
            >
              格式化 JSON
            </Button>
          </div>
          <div style={{ height: 200 }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={body}
              onChange={(value) => setBody(value || '')}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 12,
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div
          style={{
            width: 240,
            borderRight: '1px solid #f0f0f0',
            padding: 16,
            overflow: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong>接口列表</Text>
            <Button type="text" icon={<PlusOutlined />} onClick={resetForm} />
          </div>
          {!collectionId ? (
            <Text type="secondary">请先选择一个集合</Text>
          ) : endpoints.length === 0 ? (
            <Text type="secondary">暂无接口</Text>
          ) : (
            endpoints.map((endpoint) => (
              <div
                key={endpoint._id}
                onClick={() => handleSelectEndpoint(endpoint)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background:
                    selectedEndpoint?._id === endpoint._id ? '#e6f7ff' : 'transparent',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Tag
                  color={methodColors[endpoint.method]}
                  style={{ minWidth: 50, textAlign: 'center' }}
                >
                  {endpoint.method}
                </Tag>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {endpoint.name}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Card
            style={{ border: 'none', borderRadius: 0, borderBottom: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Select
                value={method}
                onChange={(value) => setMethod(value as HttpMethod)}
                style={{ width: 100 }}
              >
                {HTTP_METHODS.map((m) => (
                  <Option key={m} value={m}>
                    <span style={{ color: methodColors[m], fontWeight: 600 }}>{m}</span>
                  </Option>
                ))}
              </Select>
              <Input
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="请输入请求 URL，例如 {{base_url}}/api/users"
                style={{ flex: 1 }}
                onPressEnter={handleSend}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
              >
                发送
              </Button>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              {showNameInput && (
                <Input
                  value={endpointName}
                  onChange={(e) => setEndpointName(e.target.value)}
                  placeholder="请输入接口名称"
                  style={{ width: 200 }}
                />
              )}
              <Button
                icon={selectedEndpoint ? <EditOutlined /> : <SaveOutlined />}
                onClick={() => {
                  if (!showNameInput) {
                    if (selectedEndpoint) {
                      setEndpointName(selectedEndpoint.name);
                    }
                    setShowNameInput(true);
                  } else {
                    handleSaveEndpoint();
                  }
                }}
                loading={saving}
              >
                {selectedEndpoint ? '更新接口' : '保存接口'}
              </Button>
              {selectedEndpoint && (
                <Popconfirm
                  title="确认删除此接口？"
                  onConfirm={handleDeleteEndpoint}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              )}
              <Button onClick={resetForm}>重置</Button>
              {activeEnvironment && (
                <Tag color="green">
                  环境: {activeEnvironment.name}
                </Tag>
              )}
            </div>
          </Card>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid #f0f0f0' }}>
              <Tabs defaultActiveKey="params" items={requestTabItems} />
            </div>

            {response && (
              <Card
                style={{ border: 'none', borderRadius: 0, borderTop: '1px solid #f0f0f0', margin: 0 }}
                bodyStyle={{ padding: 16 }}
                title={
                  <Space>
                    {response.status >= 200 && response.status < 300 ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <Text strong>{response.status}</Text>
                    <Text type="secondary">{response.statusText}</Text>
                    <Text type="secondary">耗时: {response.duration}ms</Text>
                  </Space>
                }
              >
                <Tabs defaultActiveKey="body" items={responseTabItems} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </Content>
  );
};

export default RequestPanel;
