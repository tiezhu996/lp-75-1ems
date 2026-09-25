# API Debugger - 在线API调试平台

一个类似 Postman 的在线 API 调试与管理工具，支持接口测试、环境变量、接口文档生成。

## 项目主要功能

- 用户认证：注册/登录 → JWT Token → 进入工作台
- 接口集合管理：创建集合 → 在集合下创建/管理接口
- API 请求测试：选择 HTTP 方法 → 输入 URL → 添加 Headers → 编辑 Body → 发送请求
- 响应展示：状态码、耗时、响应 Body（JSON 格式化）、响应 Headers
- 环境变量：创建环境配置 → 使用 {{变量名}} 语法 → 切换环境自动替换
- 请求历史：自动保存每次请求 → 历史列表可搜索 → 点击恢复请求配置
- Monaco Editor 代码编辑器，支持 JSON 格式化

## 快速启动（Docker Compose）

```bash
# 一键构建并启动
docker compose up -d --build

# 查看容器状态
docker compose ps
```

## 本地开发

### 前置要求
- Node.js 20+
- MongoDB 7+

### 启动后端
```bash
cd backend
npm install
npm run dev
```

### 启动前端
```bash
cd frontend
npm install
npm run dev
```

## 访问地址

- 前端: http://localhost:8106
- 后端: http://localhost:3106
- MongoDB: localhost:29067

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.x | 前端框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| Ant Design | 5.x | UI 组件库 |
| Monaco Editor | 4.x | 代码编辑器 |
| Express | 4.x | 后端框架 |
| Node.js | 20.x | 运行时 |
| MongoDB | 7.x | 数据库 |
| Mongoose | 8.x | ODM |
| JWT | 9.x | 认证 |
| Docker | 24.x | 容器化 |
| Nginx | Alpine | 反向代理 |

## 项目目录结构

```
gb-75/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── api/          # API 请求封装
│   │   ├── components/   # 公共组件
│   │   ├── pages/        # 页面组件
│   │   ├── types/        # 类型定义
│   │   ├── utils/        # 工具函数
│   │   ├── App.tsx       # 应用入口
│   │   └── main.tsx      # 渲染入口
│   ├── Dockerfile        # 前端 Dockerfile
│   ├── nginx.conf        # Nginx 配置
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/              # 后端项目
│   ├── src/
│   │   ├── config/       # 配置
│   │   ├── controllers/  # 控制器
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── types/        # 类型定义
│   │   ├── utils/        # 工具函数
│   │   └── app.ts        # 应用入口
│   ├── Dockerfile        # 后端 Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── .env.example          # 环境变量示例
├── docker-compose.yml    # Docker 编排
├── .gitignore
├── .dockerignore
└── README.md
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| MONGO_URI | MongoDB 连接地址 | mongodb://mongo:27017/api_debugger |
| JWT_SECRET | JWT 签名密钥 | api-debugger-secret-key-change-this |
| JWT_EXPIRES_IN | Token 过期时间 | 7d |
| PORT | 后端服务端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| VITE_API_BASE_URL | 前端 API 基础地址 | http://localhost:3106 |

## Docker 部署说明

### 端口映射
- 前端: 8106:80
- 后端: 3106:3000
- MongoDB: 2906:27017

### 数据卷
- `mongo_data`: MongoDB 数据持久化

### 常用命令
```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 查看日志
docker compose logs -f

# 进入容器
docker exec -it api_debugger_backend sh
```

### 服务依赖关系
```
frontend (健康检查通过)
    └── depends_on: backend (健康检查通过)
        └── depends_on: mongo (健康检查通过)
```

## 测试账号

| 用户名 | 密码 |
|--------|------|
| dev1 | dev123 |
| dev2 | dev123 |

预置数据：
- 环境: 开发环境 (base_url=http://localhost:3106)
- 集合: 示例 API
- 接口:
  - GET /api/users — 获取用户列表
  - POST /api/users — 创建用户
  - GET /api/users/:id — 获取单个用户
  - PUT /api/users/:id — 更新用户

## 常见问题

### 1. MongoDB 连接失败
- 检查 MongoDB 容器状态: `docker compose ps`
- 检查端口是否被占用: `lsof -i :29067`

### 2. 前端无法访问后端 API
- 确认后端服务健康检查通过
- 检查 Nginx 配置中的代理设置

### 3. 端口冲突
- 修改 `docker-compose.yml` 中的端口映射

### 4. 构建失败
- 清理 node_modules 后重新安装
- 检查 Node.js 版本是否为 20+

## License

MIT
