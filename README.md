

让我帮您完善 README.md 文件：

```markdown:卡密管理系统/card-system_front/README.md
# 卡密管理系统

一个基于 Vue.js 和 Express.js 的卡密管理系统，支持管理员和代理商两种角色。

## 功能特点

- 🔐 多角色权限控制（管理员/代理商）
- 💳 卡密管理（创建、查询、删除）
- 👥 用户管理
- 📢 公告管理
- 💰 订单管理
- 🔄 积分系统
- 📝 我的订单

## 技术栈

### 前端
- Vue.js 2.x
- Vue Router
- Element UI
- Axios

### 后端
- Node.js
- Express.js
- MySQL
- JWT认证

## 项目结构

```bash
卡密管理系统/
├── card-system_front/          # 前端项目
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── api/               # API 接口
│   │   ├── assets/            # 资源文件
│   │   ├── components/        # 公共组件
│   │   ├── layouts/           # 布局组件
│   │   ├── router/            # 路由配置
│   │   ├── utils/             # 工具函数
│   │   ├── views/             # 页面组件
│   │   ├── App.vue            # 根组件
│   │   └── main.js            # 入口文件
│   └── package.json
│
└── card-system_backend/        # 后端项目
    ├── config/                 # 配置文件
    ├── routes/                 # 路由处理
    ├── models/                 # 数据模型
    ├── middleware/             # 中间件
    ├── utils/                  # 工具函数
    ├── index.js               # 入口文件
    └── package.json
```

## 安装和运行

### 前端

```bash
# 进入前端项目目录
cd card-system_front

# 安装依赖
npm install

# 启动开发服务器
npm run serve

# 构建生产版本
npm run build
```

### 后端

```bash
# 进入后端项目目录
cd card-system_backend

# 安装依赖
npm install

# 启动服务器
node index.js
```

## 配置说明

### 前端配置

在 `card-system_front/.env` 文件中配置：

```env
VUE_APP_BASE_API=/api
```

### 后端配置

在 `card-system_backend/config/config.js` 中配置数据库连接：

```javascript
module.exports = {
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'mus2024'
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '4h'
  }
}
```

## 权限说明

系统包含两种角色：

- 管理员（root）：可以访问所有功能
- 代理商（agent）：只能访问特定功能

### 权限控制

- 路由级别：通过 `meta.requiresRoot` 控制
- API 级别：通过 JWT token 验证

## 开发指南

### 添加新功能

1. 在 `views` 目录下创建新的页面组件
2. 在 `router/index.js` 中添加路由配置
3. 在 `api` 目录下添加相应的接口
4. 在后端添加对应的路由处理

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Vue 风格指南
- 使用 Prettier 进行代码格式化

## 部署说明

### 前端部署

1. 执行 `npm run build` 生成生产版本
2. 将 `dist` 目录下的文件部署到 Web 服务器

### 后端部署

1. 安装 PM2：`npm install -g pm2`
2. 使用 PM2 启动服务：`pm2 start index.js`

## 常见问题

1. 跨域问题：检查 `vue.config.js` 中的代理配置
2. 权限问题：确保 JWT token 正确配置
3. 数据库连接：检查数据库配置信息

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基本功能实现

## 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License
```

这个 README.md 包含了：

1. 项目概述和功能特点
2. 技术栈说明
3. 详细的项目结构
4. 安装和运行说明
5. 配置说明
6. 权限控制说明
7. 开发指南
8. 部署说明
9. 常见问题解答
10. 更新日志
11. 贡献指南
12. 许可证信息

这样的文档可以帮助新开发者快速了解和上手项目，也方便后期维护和协作。
