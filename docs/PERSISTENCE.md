# 持久化方案

> 按照大厂模板设计的 Electron 项目持久化方案

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                     渲染进程 (Vue)                        │
│  ┌───────────────────────────────────────────────────┐   │
│  │  Pinia Stores (chat, settings, app)              │   │
│  └───────────────────────────────────────────────────┘   │
│         │                    │                    │        │
│         ▼                    ▼                    ▼        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Dexie.js    │    │ contextBridge│    │  (API 调用)  │ │
│  │ (IndexedDB)  │    │   IPC 调用   │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    主进程 (Electron)                      │
│  ┌──────────────────┐    ┌──────────────────┐           │
│  │  electron-store  │    │  better-sqlite3  │           │
│  │  (简单配置)      │    │  (业务数据)      │           │
│  └──────────────────┘    └──────────────────┘           │
│         │                         │                        │
│         ▼                         ▼                        │
│  ┌──────────────────┐    ┌──────────────────┐           │
│  │  app-config.json │    │  database.sqlite │           │
│  │  (userData 目录) │    │  (userData 目录) │           │
│  └──────────────────┘    └──────────────────┘           │
│                                                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │  文件存储 (storage/ 目录)                         │    │
│  │  - storage/files/                                │    │
│  │  - storage/images/                               │    │
│  │  - storage/models/                               │    │
│  └──────────────────────────────────────────────────┘    └─────────────────────────────────────────────────────────────────────┘
```

## 分层详解

### 1. 用户设置 / 窗口状态 → electron-store

**用途**: 存储简单的键值对配置

**技术栈**: `electron-store`

**存储位置**: `~/Library/Application Support/One AI/app-config.json` (macOS)

**管理内容**:
- 窗口位置和大小
- 主题设置 (light/dark/auto)
- 语言设置 (zh-CN/en-US)
- 字体大小
- 侧边栏宽度
- 激活的模型名称
- 生成参数 (temperature, topP 等)
- 当前会话 ID

**代码位置**: `electron/store/appConfig.ts`

**使用示例**:
```typescript
import { appConfigOps, modelConfigOps } from './store'

// 获取设置
const theme = appConfigOps.get('theme')

// 保存设置
appConfigOps.set('theme', 'dark')

// 模型配置
modelConfigOps.setActiveModel('llama-2-7b')
```

---

### 2. 前端临时缓存 → Dexie.js (IndexedDB)

**用途**: 渲染进程的临时状态、草稿、缓存

**技术栈**: `dexie` + IndexedDB

**存储位置**: 浏览器 IndexedDB (在用户配置文件中)

**管理内容**:
- UI 临时状态 (折叠状态、选中项等)
- 消息草稿 (未发送的输入)
- API 响应缓存 (可设置过期时间)

**代码位置**: `src/database/index.ts`

**使用示例**:
```typescript
import { uiStateOps, draftOps, cacheOps } from '@/database'

// UI 状态
await uiStateOps.set('sidebarCollapsed', true)
const collapsed = await uiStateOps.get('sidebarCollapsed')

// 消息草稿
await draftOps.save(sessionId, '未发送的消息...')
const draft = await draftOps.get(sessionId)

// 缓存 (1小时过期)
await cacheOps.set('apiResponse', data, 60 * 60 * 1000)
const cached = await cacheOps.get('apiResponse')
```

---

### 3. 核心业务数据 → better-sqlite3

**用途**: 会话、消息等需要复杂查询的业务数据

**技术栈**: `better-sqlite3`

**存储位置**: `~/Library/Application Support/One AI/database.sqlite` (macOS)

**管理内容**:
- 聊天会话 (sessions 表)
- 聊天消息 (messages 表)
- 支持索引和复杂查询

**代码位置**: `electron/database/sqlite.ts`

**表结构**:

```sql
-- 会话表
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 消息表
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
```

**使用示例**:
```typescript
import { sessionOps, messageOps } from './database'

// 会话操作
const sessions = sessionOps.getAll()
sessionOps.create({ id, title, created_at, updated_at })

// 消息操作
const messages = messageOps.getBySession(sessionId)
messageOps.add(sessionId, 'user', 'Hello', Date.now())
```

---

### 4. 文件存储 → userData 目录

**用途**: 图片、文件、模型等二进制数据

**技术栈**: Node.js `fs` 模块

**存储位置**: `~/Library/Application Support/One AI/storage/` (macOS)

**目录结构**:
```
storage/
├── files/      # 用户上传的文件
├── images/     # 图片
└── models/     # 模型文件
```

**数据库只存储**: 文件的相对路径

**代码位置**: `electron/database/fileStorage.ts`

**使用示例**:
```typescript
import { saveImage, saveFile, getAbsolutePath, fileExists } from './database'

// 保存图片
const relativePath = await saveImage('/tmp/photo.png', 'photo.png')
// → "images/photo-1234567890-abc123.png"

// 获取绝对路径
const fullPath = getAbsolutePath(relativePath)
// → "/Users/xxx/Library/Application Support/One AI/storage/images/..."

// 检查是否存在
const exists = fileExists(relativePath)
```

---

## IPC API (渲染进程 → 主进程)

### 数据库操作 (SQLite)

```typescript
// 在渲染进程中
window.electronAPI.db.getSessions()
window.electronAPI.db.createSession(session)
window.electronAPI.db.updateSession(id, updates)
window.electronAPI.db.deleteSession(id)

window.electronAPI.db.getMessages(sessionId)
window.electronAPI.db.addMessage(sessionId, role, content, createdAt)
window.electronAPI.db.updateLastMessage(sessionId, content)
window.electronAPI.db.clearMessages(sessionId)
```

### 配置操作 (electron-store)

```typescript
window.electronAPI.config.get('theme')
window.electronAPI.config.set('theme', 'dark')
window.electronAPI.config.getAll()
window.electronAPI.config.reset()
```

### 文件操作

```typescript
window.electronAPI.file.save(sourcePath, originalName)
window.electronAPI.file.saveImage(sourcePath, originalName)
window.electronAPI.file.saveBase64Image(base64Data, 'png')
window.electronAPI.file.getPath(relativePath)
window.electronAPI.file.exists(relativePath)
window.electronAPI.file.delete(relativePath)
window.electronAPI.file.read(relativePath)
```

---

## 迁移指南

从旧的 LevelDB 迁移到新方案：

1. **electron-store** 已经兼容旧的配置格式，无需迁移
2. **SQLite** 创建新的数据库，旧 LevelDB 数据可通过迁移脚本导入
3. **Dexie.js** 是新的渲染进程缓存，无历史数据

---

## 清理旧依赖

可以卸载以下不再使用的依赖：
- `leveldown`
- `levelup`
- `lowdb`
- `nedb`
