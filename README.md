# One AI

基于 Vue 3 + TypeScript + Electron 的本地 LLM 聊天应用，**完全离线运行**，无需依赖云侧服务。集成市场行情抓取与定时任务，打造全方位的个人本地 AI 工具。

## ✨ 特性

- 🤖 **本地 LLM 聊天**: 完全离线运行，保护隐私。基于 `node-llama-cpp` 驱动。
- 📊 **市场数据看板**: 实时集成选股通 API，可视化展示市场涨跌家数比，支持手动/定时同步。
- ⏰ **定时任务引擎**: 内置 Cron 服务，支持后台自动同步数据、清理缓存等自动化操作。
- 💾 **多层持久化架构**: 
  - **SQLite (better-sqlite3)**: 存储海量聊天消息、会话及市场历史。
  - **electron-store**: 极速存储应用配置与窗口状态。
- 📦 **模型管理**: 支持下载、导入和管理多个 GGUF 格式模型。
- 🎨 **现代化 UI**: 基于 Naive UI 组件库，支持深色/浅色主题。
- ⚡ **流式输出**: 复刻主流 AI 体验，实时显示回复文本。
- 🔒 **隐私安全**: 所有数据均存储在本地 `userData` 目录，绝不上传云端。

## 🛠️ 技术栈

### 核心框架
- **Electron 30** - 跨平台桌面应用容器
- **Vue 3** - 前端渲染框架 (Composition API)
- **Vite 5** - 极速构建与开发工具

### 基础设施层
- **Better-SQLite3** - 高性能本地关系型数据库
- **node-llama-cpp** - 本地运行 Llama/GGUF 模型的 C++ 绑定
- **Electron Store** - 轻量级配置存储
- **Node-Cron** - 定时任务调度器

### UI & UX
- **Naive UI** - 优雅的组件库
- **Tailwind CSS** - 原子级 CSS 框架
- **@vicons/ionicons5** - 丰富的图标集
- **Markdown-it** - 高度可定制的 Markdown 渲染

## 📁 项目结构 (核心)

```
one/
├── electron/               # 主进程代码 (TypeScript)
│   ├── core/               # 核心引导逻辑 (Bootstrap)
│   ├── handlers/           # IPC 处理器层 (通信桥梁)
│   ├── infrastructure/     # 基础设施层 (SQLite, Store, Storage)
│   ├── services/           # 业务逻辑层 (Model, Cron, UI, Integration)
│   ├── main.ts             # 主进程入口
│   └── preload.ts          # 预加载脚本
├── src/                    # 渲染进程代码 (Vue 3)
│   ├── views/              # 页面 (Chat, MarketData, Settings)
│   ├── stores/             # Pinia 状态管理
│   ├── layouts/            # 页面布局管理
│   └── App.vue             # 根组件 (含全局 Provider)
├── docs/                   # 详细设计与开发文档
├── .github/                # GitHub 社区模板
├── package.json            # 依赖与脚本
└── vite.config.ts          # 构建配置
```

## 🚀 快速开始

### 1. 环境准备

- **Node.js**: >= 18.0.0
- **C++ 编译环境**: (node-llama-cpp 构建需要)
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools

### 2. 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 编译打包 (使用 electron-builder)
npm run build
```

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议。

## 🤝 参与贡献

欢迎通过以下方式参与：
1. **反馈 Bug**: 提交 [Issue](https://github.com/zhangjiahao/one/issues)。
2. **功能建议**: 提交功能需求。
3. **贡献代码**: 请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

*One AI - 让 AI 真正属于你的本地终端。*
