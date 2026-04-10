# One AI 开发文档

> 本文档旨在帮助开发者理解和维护 One AI 项目，包括项目架构、核心模块、开发流程等。

## 📋 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [核心模块](#核心模块)
- [开发指南](#开发指南)
- [IPC 通信](#ipc-通信)
- [常见问题](#常见问题)

---

## 项目概述

One AI 是一个基于 Electron + Vue 3 + TypeScript 的本地 LLM 聊天应用，具有以下特点：

- 完全离线运行，保护隐私
- 使用 node-llama-cpp 作为 LLM 引擎
- 支持 GGUF 格式模型
- 多会话管理
- 同花顺联动功能

---

## 技术架构

### 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | Vue 3 | ^3.4.21 | Composition API |
| **状态管理** | Pinia | ^2.1.7 | 新一代状态管理 |
| **路由** | Vue Router | ^5.0.4 | 官方路由 |
| **UI 组件** | Naive UI | ^2.38.1 | Vue 3 组件库 |
| **Markdown** | markdown-it | ^14.1.1 | Markdown 渲染 |
| **代码高亮** | highlight.js | ^11.11.1 | 代码块高亮 |
| **桌面端** | Electron | ^30.0.1 | 跨平台桌面应用 |
| **LLM 引擎** | node-llama-cpp | ^3.18.1 | 本地 LLM 运行 |
| **打包工具** | electron-builder | ^24.13.3 | 应用打包 |
| **构建工具** | Vite | ^5.1.6 | 前端构建 |
| **语言** | TypeScript | ^5.2.2 | 类型安全 |
| **代码检查** | ESLint | ^8.57.0 | 代码规范 |
| **格式化** | Prettier | ^3.2.5 | 代码格式化 |

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        渲染进程 (Vue 3)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Views      │  │  Components  │  │   Stores     │    │
│  │  (Chat.vue)  │  │(StockLink)  │  │(Pinia)      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                   │
│                    ┌───────▼───────┐                           │
│                    │  Preload.ts    │                           │
│                    │  (IPC Bridge)  │                           │
│                    └───────┬───────┘                           │
└───────────────────────────┼───────────────────────────────────┘
                            │ IPC (Inter-Process Communication)
┌───────────────────────────▼───────────────────────────────────┐
│                        主进程 (Electron)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   IPC        │  │   Services   │  │  Integration │    │
│  │  Handlers    │  │  (Model etc) │  │(TongHuaShun)│    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                   │
│                    ┌───────▼───────┐                           │
│                    │  node-llama-cpp│                           │
│                    │   (LLM Engine)  │                           │
│                    └───────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 项目结构

### 完整目录树

```
one/
├── src/                                    # 渲染进程（前端）
│   ├── assets/                            # 静态资源
│   │   ├── main.css                       # 全局样式
│   │   └── vue.svg                        # Vue logo
│   ├── components/                        # Vue 组件（自动导入）
│   │   └── StockLink.vue                  # 股票链接组件（同花顺联动）
│   ├── composables/                       # 可复用组合式函数
│   │   ├── useChat.ts                     # 聊天逻辑
│   │   └── useModels.ts                   # 模型管理
│   ├── constants/                         # 常量定义
│   │   └── index.ts
│   ├── database/                          # IndexedDB 数据库（Dexie）
│   │   └── index.ts                       # 数据库初始化和操作
│   ├── layouts/                           # 布局组件
│   │   └── MainLayout.vue                 # 主布局
│   ├── router/                            # 路由配置
│   │   └── index.ts
│   ├── shared/                            # 共享模块
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── stores/                            # Pinia 状态管理
│   │   ├── app.ts                         # 应用全局状态
│   │   ├── chat.ts                        # 聊天状态（多会话）
│   │   ├── index.ts
│   │   └── settings.ts                    # 设置状态
│   ├── types/                             # TypeScript 类型定义
│   │   ├── electronAPI.d.ts               # Electron API 类型
│   │   └── index.ts
│   ├── utils/                             # 工具函数
│   │   ├── format.ts                      # 格式化工具
│   │   ├── index.ts
│   │   ├── logger.ts                      # 日志封装
│   │   └── storage.ts                     # 存储封装
│   ├── views/                             # 页面组件
│   │   ├── About.vue                      # 关于页面
│   │   ├── AppSettings.vue                # 应用设置
│   │   ├── Chat.vue                       # 聊天页面
│   │   ├── Settings.vue                   # 设置页面（模型管理）
│   │   ├── SettingsLayout.vue             # 设置布局
│   │   └── StockDemo.vue                  # 同花顺联动演示
│   ├── App.vue                            # 根组件
│   ├── auto-imports.d.ts                  # 自动导入类型
│   ├── components.d.ts                     # 组件自动注册类型
│   ├── main.ts                            # 应用入口
│   └── vite-env.d.ts                      # Vite 环境类型
├── electron/                               # 主进程（Electron）
│   ├── constants/                         # 常量定义
│   │   └── index.ts                       # IPC 通道等
│   ├── database/                          # 数据库操作
│   │   ├── fileStorage.ts                 # 文件存储
│   │   ├── index.ts
│   │   └── sqlite.ts                      # SQLite 数据库
│   ├── services/                          # 核心服务
│   │   ├── core/                          # 核心服务
│   │   │   └── appBootstrap.ts            # 应用启动
│   │   ├── integration/                   # 第三方集成
│   │   │   └── tonghuashunService.ts     # 同花顺联动服务
│   │   ├── ipc/                           # IPC 处理器（统一目录）
│   │   │   ├── appHandlers.ts             # 应用相关 IPC
│   │   │   ├── dbHandlers.ts              # 数据库 IPC
│   │   │   ├── fileHandlers.ts            # 文件操作 IPC
│   │   │   ├── index.ts
│   │   │   ├── ipcRegistry.ts             # IPC 注册中心
│   │   │   └── tonghuashunHandlers.ts    # 同花顺 IPC
│   │   ├── models/                        # 模型服务
│   │   │   ├── index.ts
│   │   │   └── modelService.ts            # 模型服务（LLM 处理）
│   │   ├── storage/                       # 存储服务
│   │   │   └── index.ts
│   │   └── ui/                            # UI 相关服务
│   │       ├── index.ts
│   │       ├── menuBuilder.ts             # 菜单构建
│   │       ├── trayManager.ts             # 托盘管理
│   │       └── windowManager.ts           # 窗口管理
│   ├── store/                             # 主进程存储
│   │   ├── appConfig.ts                   # 应用配置
│   │   └── index.ts
│   ├── types/                             # 类型定义
│   │   └── index.ts
│   ├── utils/                             # 工具函数
│   │   ├── downloadUtils.ts               # 下载工具
│   │   └── fileUtils.ts                   # 文件操作工具
│   ├── electron-env.d.ts                  # Electron 环境类型
│   ├── main.ts                            # 主进程入口
│   └── preload.ts                         # 预加载脚本
├── public/                                 # 公共资源
├── dist/                                   # 渲染进程构建输出
├── dist-electron/                          # 主进程构建输出
├── release/                                # 打包输出
├── docs/                                   # 文档
│   ├── DEVELOPMENT.md                     # 本文档
│   └── PERSISTENCE.md                     # 持久化方案文档
├── .editorconfig                           # EditorConfig 配置
├── .eslintignore                          # ESLint 忽略
├── .eslintrc.json                         # ESLint 配置
├── .gitignore                             # Git 忽略
├── .prettierignore                        # Prettier 忽略
├── .prettierrc                            # Prettier 配置
├── electron-builder.json5                 # electron-builder 配置
├── index.html                              # HTML 模板
├── package.json                            # 项目依赖
├── package-lock.json                       # 依赖锁定
├── README.md                               # 项目说明
├── tsconfig.json                           # TypeScript 配置
├── tsconfig.node.json                      # Node TypeScript 配置
└── vite.config.ts                          # Vite 配置
```

---

## 核心模块

### 1. 模型服务 (`electron/services/models/modelService.ts`)

这是核心模块，负责：
- 模型加载和卸载
- LLM 推理和回复生成
- 模型下载和管理
- 本地模型导入

#### 关键类和方法

```typescript
class LlamaService {
  // 加载模型
  private async loadModel(modelName: string): Promise<void>
  
  // 生成回复
  private async generateResponse(prompt: string): Promise<void>
  
  // 下载模型
  async downloadModel(preset: ModelPreset): Promise<void>
  
  // 导入本地模型
  async importModel(): Promise<{ success: boolean; error?: string }>
  
  // 删除模型
  async deleteModel(filename: string): Promise<void>
  
  // 列出模型
  async listModels(): Promise<ModelInfo[]>
}
```

#### 使用 node-llama-cpp

```typescript
import { getLlama, LlamaChatSession } from 'node-llama-cpp'

// 1. 初始化 Llama
const llama = await getLlama()

// 2. 加载模型
const model = await llama.loadModel({ modelPath })

// 3. 创建上下文
const context = await model.createContext()

// 4. 创建会话
const sequence = context.getSequence()
const chatSession = new LlamaChatSession({
  contextSequence: sequence,
  chatWrapper: 'auto'
})

// 5. 生成回复（流式输出）
await chatSession.prompt(prompt, {
  onTextChunk: (text: string) => {
    // 处理流式输出
  }
})
```

### 2. IPC 通信

所有 IPC 处理器统一放在 `electron/services/ipc/` 目录：

#### IPC 通道常量 (`electron/constants/index.ts`)

```typescript
export const IpcChannel = {
  // 聊天
  CHAT_SEND: 'chat:send',
  CHAT_STOP: 'chat:stop',
  CHAT_STREAM: 'chat:stream',
  CHAT_ERROR: 'chat:error',
  CHAT_END: 'chat:end',
  
  // 模型
  LIST_MODELS: 'list-models',
  DOWNLOAD_MODEL: 'download-model',
  DOWNLOAD_PROGRESS: 'download-progress',
  DELETE_MODEL: 'delete-model',
  SET_ACTIVE_MODEL: 'set-active-model',
  IMPORT_MODEL: 'import-model',
  
  // 数据库
  DB_GET_SESSIONS: 'db:get-sessions',
  DB_CREATE_SESSION: 'db:create-session',
  DB_GET_MESSAGES: 'db:get-messages',
  DB_ADD_MESSAGE: 'db:add-message',
  
  // 配置
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_ALL: 'config:get-all',
  CONFIG_RESET: 'config:reset',
  
  // 文件
  FILE_SAVE: 'file:save',
  FILE_READ: 'file:read',
  
  // 同花顺
  OPEN_TONGHUASHUN_STOCK: 'open-tonghuashun-stock',
  OPEN_TONGHUASHUN_APP: 'open-tonghuashun-app',
} as const
```

#### IPC 注册中心 (`electron/services/ipc/ipcRegistry.ts`)

```typescript
export function initAllHandlers(): void {
  log.info('[IPCRegistry] 初始化所有 IPC 处理器')

  initDbHandlers()        // 数据库
  initFileHandlers()      // 文件操作
  initAppHandlers()       // 应用相关
  initTongHuaShunHandlers() // 同花顺
}
```

### 3. 同花顺联动 (`electron/services/integration/tonghuashunService.ts`)

提供与同花顺的联动功能：

```typescript
class TongHuaShunService {
  // 打开指定股票代码
  async openStock(stockCode: string): Promise<{ success: boolean; error?: string }>
  
  // 打开同花顺应用
  async openApp(): Promise<{ success: boolean; error?: string }>
}
```

#### URL Scheme 尝试顺序

1. `amihexin://stock/${code}`
2. `fls://stockpage/${code}`
3. `amihexin://`

### 4. 状态管理 (`src/stores/`)

#### `settings.ts` - 设置状态

- `activeModelName`: 当前选中的模型
- `models`: 模型列表
- `generationParams`: 生成参数
- 应用设置（主题、语言、字体大小等）

#### `chat.ts` - 聊天状态

- 多会话管理
- 当前会话消息
- 生成状态

#### `app.ts` - 应用全局状态

- 加载状态
- 侧边栏状态

---

## 开发指南

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **操作系统**: macOS / Windows / Linux

### 开发流程

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发模式

```bash
npm run dev
```

这会同时启动：
- Vite 开发服务器（渲染进程）
- Electron 主进程
- 自动热重载

#### 3. 代码检查

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 检查并自动修复
npm run lint

# Prettier 格式化
npm run format

# 完整检查（推荐提交前运行）
npm run check
```

#### 4. 构建应用

```bash
# 开发构建
npm run build

# 打包成可执行文件
npm run build && electron-builder
```

### 添加新功能

#### 1. 添加新的 IPC 处理器

1. 在 `electron/services/ipc/` 创建新文件，如 `myFeatureHandlers.ts`
2. 导出初始化函数 `initMyFeatureHandlers()`
3. 在 `ipcRegistry.ts` 中注册
4. 在 `electron/constants/index.ts` 中添加 IPC 通道常量
5. 在 `preload.ts` 中暴露 API（如需要）
6. 在渲染进程中调用

#### 2. 添加新的页面

1. 在 `src/views/` 创建新的 Vue 组件
2. 在 `src/router/index.ts` 中添加路由
3. 在 `src/layouts/MainLayout.vue` 中添加导航（如需要）

#### 3. 添加新的集成服务

参考 `tonghuashunService.ts` 的实现：
1. 在 `electron/services/integration/` 创建服务类
2. 实现核心方法
3. 创建对应的 IPC 处理器
4. 在渲染进程中创建组件调用

---

## IPC 通信

### 基本流程

```
渲染进程            Preload              主进程
   |                  |                    |
   |-- invoke() ----->|                    |
   |                  |-- ipcRenderer.invoke() -->|
   |                  |                    |-- handle()
   |                  |                    |-- 处理逻辑
   |                  |<-- return --------|
   |<-- result --------|                    |
```

### 发送消息（渲染进程 → 主进程）

```typescript
// 渲染进程
if (window.ipcRenderer) {
  const result = await window.ipcRenderer.invoke('channel-name', params)
}

// 主进程
ipcMain.handle('channel-name', async (_event, params) => {
  // 处理逻辑
  return result
})
```

### 接收消息（主进程 → 渲染进程）

```typescript
// 主进程
mainWindow.webContents.send('channel-name', data)

// 渲染进程
window.ipcRenderer?.on('channel-name', (_event, data) => {
  // 处理数据
})
```

### 聊天流式输出示例

```typescript
// 主进程（发送 token）
private sendChatToken(token: string): void {
  if (this.mainWindow) {
    this.mainWindow.webContents.send(IpcChannel.CHAT_STREAM, token)
  }
}

// 渲染进程（接收 token）
useEffect(() => {
  const unsubscribe = window.ipcRenderer?.on(
    'chat:stream',
    (_event, token: string) => {
      // 追加到消息
    }
  )
  return unsubscribe
}, [])
```

---

## 常见问题

### 1. 模型加载失败

**问题**：`Error: ENOENT: no such file or directory`

**解决方案**：
- 确保模型文件存在于 `~/Library/Application Support/one/models/`（macOS）
- 确保模型是 GGUF 格式
- 检查文件权限

### 2. IPC 处理器重复注册

**问题**：`Error: Attempted to register a second handler`

**解决方案**：
- 检查所有 IPC 处理器文件
- 确保每个 channel 只注册一次
- 统一使用 `ipcRegistry.ts` 管理

### 3. node-llama-cpp API 错误

**问题**：`this.context.complete is not a function`

**解决方案**：
- 使用 `LlamaChatSession` 类
- 调用 `chatSession.prompt()` 而非 `context.complete()`
- 参考 node-llama-cpp 官方文档

### 4. TypeScript 类型错误

**问题**：类型检查失败

**解决方案**：
- 运行 `npm run type-check` 查看具体错误
- 确保所有文件都有正确的类型定义
- 对于第三方库，使用 `any` 或声明模块类型

### 5. 构建失败

**问题**：electron-builder 打包失败

**解决方案**：
- 确保 `npm run build` 成功
- 检查 `electron-builder.json5` 配置
- 清理 `dist/` 和 `dist-electron/` 后重试

---

## 参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Electron 官方文档](https://www.electronjs.org/)
- [node-llama-cpp GitHub](https://github.com/withcatai/node-llama-cpp)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Naive UI 组件库](https://www.naiveui.com/)

---

## 更新日志

### 2026-04-09
- ✅ 统一 IPC 处理器目录结构
- ✅ 添加同花顺联动功能
- ✅ 修复 node-llama-cpp API 使用
- ✅ 添加模型导入功能
- ✅ 优化代码结构和规范
