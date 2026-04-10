# 系统架构与请求流程

## 📋 目录
- [整体架构](#整体架构)
- [IPC 通信流程](#ipc-通信流程)
- [聊天请求流程](#聊天请求流程)
- [持久化方案](#持久化方案)

---

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              渲染进程 (Vue 3)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   App.vue    │  │   页面视图     │  │  Pinia Store  │  │   组件层      │ │
│  │              │  │ (Chat/Settings)│  │  (状态管理)    │  │ (StockLink)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                   │                   │                   │         │
│         └───────────────────┴───────────────────┴───────────────────┘         │
│                                     │                                             │
│                          ┌──────────▼──────────┐                                 │
│                          │  window.ipcRenderer  │                                 │
│                          │   (Preload 暴露)     │                                 │
│                          └──────────┬──────────┘                                 │
└─────────────────────────────────────┼─────────────────────────────────────────────┘
                                      │
                                      │ IPC 通信
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────────────┐
│                              主进程 (Electron)                                   │
│  ┌──────────────────────────────────┼──────────────────────────────────────────┐  │
│  │  IPC 处理器层                    │                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ appHandlers.ts      (应用相关)                                        │  │  │
│  │  │ dbHandlers.ts       (数据库)                                           │  │  │
│  │  │ fileHandlers.ts     (文件操作)                                         │  │  │
│  │  │ modelHandlers.ts    (模型管理)                                         │  │  │
│  │  │ tonghuashunHandlers.ts (同花顺联动)                                     │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────┼──────────────────────────────────────────┘  │
│                                     │                                             │
│  ┌──────────────────────────────────▼──────────────────────────────────────────┐  │
│  │  服务层                                                                      │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ ModelService.ts   (模型加载/聊天生成)                                  │  │  │
│  │  │ WindowManager.ts  (窗口管理)                                           │  │  │
│  │  │ TrayManager.ts    (系统托盘)                                           │  │  │
│  │  │ MenuBuilder.ts    (菜单构建)                                           │  │  │
│  │  │ TongHuaShunService.ts (同花顺联动)                                     │  │  │
│  │  │ XuanguBaoService.ts   (选股通数据抓取) ✨                              │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────┼──────────────────────────────────────────┘  │
│                                     │                                             │
│  ┌──────────────────────────────────▼──────────────────────────────────────────┐  │
│  │  持久化层                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ SQLite (better-sqlite3)                                                │  │  │
│  │  │   - sessions (会话表)                                                  │  │  │
│  │  │   - messages (消息表)                                                  │  │  │
│  │  │                                                                         │  │  │
│  │  │ electron-store (配置存储)                                               │  │  │
│  │  │   - 窗口状态                                                           │  │  │
│  │  │   - 用户设置                                                           │  │  │
│  │  │   - 模型配置                                                           │  │  │
│  │  │                                                                         │  │  │
│  │  │ 文件存储 (userData)                                                    │  │  │
│  │  │   - models/ (GGUF 模型文件)                                           │  │  │
│  │  │   - files/ (用户上传文件)                                              │  │  │
│  │  │   - images/ (图片)                                                     │  │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 IPC 通信流程

### 1. 请求-响应模式

```
渲染进程                          主进程
   │                               │
   │  window.ipcRenderer.invoke()  │
   │  ───────────────────────────► │
   │                               │
   │                        业务逻辑处理
   │                               │
   │  返回 Promise.resolve()      │
   │  ◄─────────────────────────── │
   │                               │
```

### 2. 主进程主动推送模式

```
渲染进程                          主进程
   │                               │
   │  监听事件                     │
   │  window.ipcRenderer.on()     │
   │                               │
   │                               │  事件触发
   │                               │  mainWindow.webContents.send()
   │  ◄─────────────────────────── │
   │                               │
```

---

## 💬 聊天请求流程

### 完整流程图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            用户发送消息                                           │
│                         (ChatInput.vue)                                         │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       chatStore.sendChatMessage()                                │
│  1. 构建消息对象                                                                 │
│  2. 更新前端状态（添加到消息列表）                                                │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  window.ipcRenderer.invoke('start-chat', prompt)               │
│                  (Preload 暴露的 API)                                           │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     │ IPC 通信
                                     │
┌────────────────────────────────────▼────────────────────────────────────────────┐
│                           IPC 处理器层                                           │
│              modelHandlers.ts: ipcMain.handle('start-chat', ...)               │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ModelService.handleChatRequest()                          │
│  1. 检查是否有模型加载                                                           │
│  2. 设置 abortController                                                         │
│  3. 调用 generateResponse()                                                       │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ModelService.generateResponse()                           │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. 验证提示词非空                                                          │ │
│  │ 2. 使用 LlamaChatSession.prompt() 生成回复                                │ │
│  │    ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │    │ onTextChunk 回调 (流式输出)                                       │   │ │
│  │    │   - 调用 sendChatToken(text)                                     │   │ │
│  │    │   - 主进程 → 渲染进程推送 (chat-token)                           │   │ │
│  │    └─────────────────────────────────────────────────────────────────┘   │ │
│  │ 3. 生成完成 → sendChatEnd()                                              │ │
│  │ 4. 错误处理 → sendChatError()                                            │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│  chat-token    │       │   chat-end     │       │  chat-error    │
│  (流式 Token)  │       │  (生成结束)     │       │   (错误)       │
└────────┬───────┘       └────────┬───────┘       └────────┬───────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        渲染进程 (chatStore)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ chat-token:                                                           │ │
│  │   - 更新最后一条消息的 content                                         │ │
│  │   - 调用 messageOps.updateLastContent() 保存到数据库                  │ │
│  │                                                                         │ │
│  │ chat-end:                                                              │ │
│  │   - 标记生成完成                                                       │ │
│  │   - 调用 messageOps.add() 保存消息                                    │ │
│  │                                                                         │ │
│  │ chat-error:                                                            │ │
│  │   - 显示错误提示                                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          ChatView.vue (UI 更新)                          │
│  - 实时显示流式输出                                                       │
│  - 显示错误提示                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 序列图

```mermaid
sequenceDiagram
    participant User as 用户
    participant View as ChatView.vue
    participant Store as chatStore
    participant Preload as Preload
    participant IPC as IPC 处理器
    participant Model as ModelService
    participant DB as SQLite
    participant UI as 渲染进程 UI

    User->>View: 输入消息并发送
    View->>Store: sendChatMessage(prompt)
    Store->>Store: 添加消息到本地列表
    Store->>Preload: invoke('start-chat', prompt)
    Preload->>IPC: 转发到主进程
    IPC->>Model: handleChatRequest(prompt)
    Model->>Model: generateResponse(prompt)
    
    loop 流式输出
        Model->>Model: LlamaChatSession.prompt()
        Model->>UI: sendChatToken(text)
        UI->>Store: 接收 chat-token 事件
        Store->>Store: 更新最后一条消息内容
        Store->>DB: updateLastContent()
        Store->>View: 响应式更新
        View->>User: 实时显示
    end
    
    alt 成功
        Model->>UI: sendChatEnd()
        UI->>Store: 接收 chat-end 事件
        Store->>DB: messageOps.add() 保存完整消息
    else 失败
        Model->>UI: sendChatError(error)
        UI->>Store: 接收 chat-error 事件
        Store->>View: 显示错误提示
    end
```

---

---

## 📊 市场数据同步流程

### 1. 手动同步（UI 触发）

```mermaid
sequenceDiagram
    participant UI as MarketData.vue
    participant IPC as dbHandlers.ts
    participant Svc as XuanguBaoService
    participant DB as SQLite
    
    UI->>UI: 点击“同步今日数据”
    UI->>IPC: invoke('db:sync-market-data')
    IPC->>Svc: getMarketIndicator(today)
    Svc-->>IPC: 返回上涨/下跌家数
    IPC->>DB: marketDataOps.save()
    DB-->>IPC: 写入成功
    IPC-->>UI: 返回 { success: true }
    UI->>UI: 自动 fetchData() 刷新表格
```

```

---

## 💾 持久化方案

### 三层存储架构

| 层级 | 技术 | 用途 | 存储位置 |
|------|------|------|----------|
| **配置层** | electron-store | 简单键值配置 | userData/app-config.json |
| **业务层** | better-sqlite3 | 会话、消息 | userData/database.sqlite |
| **文件层** | Node.js fs | 模型、图片、文件 | userData/storage/ |

### 数据库表结构

#### sessions（会话表）
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
```

#### messages（消息表）
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
```

---

## 📁 文件结构

```
one/
├── electron/                    # 主进程代码
│   ├── constants/              # 常量
│   │   └── index.ts            # IPC 通道、配置等
│   ├── database/               # 数据库层
│   │   ├── index.ts            # 统一导出
│   │   ├── sqlite.ts           # SQLite 操作
│   │   └── fileStorage.ts      # 文件存储
│   ├── services/               # 服务层
│   │   ├── core/               # 核心服务
│   │   │   └── appBootstrap.ts # 应用启动引导
│   │   ├── ipc/                # IPC 处理器
│   │   │   ├── ipcRegistry.ts  # 注册中心
│   │   │   ├── appHandlers.ts
│   │   │   ├── dbHandlers.ts
│   │   │   ├── fileHandlers.ts
│   │   │   └── tonghuashunHandlers.ts
│   │   ├── models/             # 模型服务
│   │   │   └── modelService.ts
│   │   ├── storage/            # 存储服务
│   │   │   └── index.ts
│   │   └── ui/                 # UI 服务
│   │       ├── windowManager.ts
│   │       ├── trayManager.ts
│   │       └── menuBuilder.ts
│   ├── store/                  # electron-store
│   │   └── index.ts
│   ├── types/                  # 类型定义
│   ├── utils/                  # 工具函数
│   ├── main.ts                 # 主进程入口
│   └── preload.ts              # Preload 脚本
│
├── src/                        # 渲染进程代码
│   ├── components/             # 组件
│   ├── composables/            # Composables
│   ├── constants/              # 常量
│   ├── database/               # Dexie (未使用)
│   ├── layouts/                # 布局
│   ├── router/                 # 路由
│   ├── stores/                 # Pinia Stores
│   ├── types/                  # 类型定义
│   ├── utils/                  # 工具函数
│   ├── views/                  # 页面视图
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 渲染进程入口
│
└── docs/                       # 文档 ✨
    ├── ARCHITECTURE.md         # 本文档
    ├── PERSISTENCE.md          # 持久化方案
    └── DEVELOPMENT.md          # 开发文档
```
