/**
 * 应用常量配置
 */

import type { ModelPreset } from '../types'
import type { Component } from 'vue'

// ==================== 应用信息 ====================

/** 应用名称 */
export const APP_NAME = 'One AI'

/** 应用版本 */
export const APP_VERSION = '1.0.0'

/** 应用描述 */
export const APP_DESCRIPTION = '本地 LLM 聊天助手'

/** 作者信息 */
export const APP_AUTHOR = 'One AI Team'

/** GitHub 仓库地址 */
export const APP_GITHUB_URL = ''

/** 许可证 */
export const APP_LICENSE = 'MIT License'

// ==================== 存储键名 ====================

/** LocalStorage 键名 */
export const StorageKeys = {
  /** 活动模型 */
  ACTIVE_MODEL: 'activeModel',
  /** 应用设置 */
  APP_SETTINGS: 'appSettings',
  /** 窗口状态 */
  WINDOW_STATE: 'windowState',
} as const

// ==================== 模型配置 ====================

/** 模型预设列表（GGUF 格式） */
export const MODEL_PRESETS: readonly ModelPreset[] = [
  {
    name: 'Qwen2.5-0.5B-Instruct-GGUF',
    displayName: 'Qwen 2.5 (0.5B)',
    modelId: 'Qwen2.5-0.5B-Instruct',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    filename: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  },
  {
    name: 'Llama-3.2-1B-Instruct-GGUF',
    displayName: 'Llama 3.2 (1B)',
    modelId: 'Llama-3.2-1B-Instruct',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    filename: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
  },
  {
    name: 'Llama-3.2-3B-Instruct-GGUF',
    displayName: 'Llama 3.2 (3B)',
    modelId: 'Llama-3.2-3B-Instruct',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    filename: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
  },
  {
    name: 'TinyLLaMA-1.1B-Chat-v1.0-GGUF',
    displayName: 'TinyLlama (1.1B)',
    modelId: 'TinyLLaMA-1.1B-Chat-v1.0',
    url: 'https://huggingface.co/TheBloke/TinyLLaMA-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    filename: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
  },
  {
    name: 'Mistral-7B-Instruct-v0.3-GGUF',
    displayName: 'Mistral (7B)',
    modelId: 'Mistral-7B-Instruct-v0.3',
    url: 'https://huggingface.co/bartowski/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/Mistral-7B-Instruct-v0.3-Q4_K_M.gguf',
    filename: 'Mistral-7B-Instruct-v0.3-Q4_K_M.gguf',
  },
] as const

// ==================== 下载配置 ====================

/** 下载配置 */
export const DownloadConfig = {
  /** 最小文件大小（1MB） */
  MIN_FILE_SIZE: 1024 * 1024,
  /** 重定向状态码 */
  REDIRECT_STATUS_CODES: [301, 302, 303, 307, 308],
} as const

// ==================== 窗口配置 ====================

/** 窗口配置 */
export const WindowConfig = {
  /** 默认宽度 */
  DEFAULT_WIDTH: 1200,
  /** 默认高度 */
  DEFAULT_HEIGHT: 800,
  /** 最小宽度 */
  MIN_WIDTH: 900,
  /** 最小高度 */
  MIN_HEIGHT: 600,
} as const

// ==================== 路由配置（大厂动态路由风格）====================

/** 路由元信息 */
export interface RouteMeta {
  /** 页面标题 */
  title: string
  /** 是否需要认证 */
  requiresAuth?: boolean
  /** 菜单图标 */
  icon?: Component
  /** 是否在菜单中隐藏 */
  hidden?: boolean
  /** 排序 */
  order?: number
  /** 是否缓存 */
  keepAlive?: boolean
}

/** 路由路径常量 */
export const RoutePath = {
  /** 首页 */
  HOME: '/home',
  /** AI对话页面 */
  CHAT: '/chat',
  /** 设置页面 */
  SETTINGS: '/settings',
  /** 模型设置 */
  SETTINGS_MODEL: '/settings/model',
  /** 应用设置 */
  SETTINGS_APP: '/settings/app',
  /** 关于页面 */
  ABOUT: '/settings/about',
  /** 市场数据 */
  MARKET_DATA: '/market',
} as const

/** 路由名称常量 */
export const RouteName = {
  HOME: 'Home',
  CHAT: 'Chat',
  SETTINGS: 'Settings',
  SETTINGS_MODEL: 'ModelSettings',
  SETTINGS_APP: 'AppSettings',
  ABOUT: 'About',
  MARKET_DATA: 'MarketData',
} as const

// ==================== 菜单配置 ====================

/** 侧边栏菜单项 */
export interface AppMenuItem {
  /** 菜单唯一标识 */
  key: string
  /** 菜单标题 */
  title: string
  /** 路由路径 */
  path: string
  /** 路由名称 */
  name?: string
  /** 图标组件 */
  icon?: Component
  /** 子菜单 */
  children?: AppMenuItem[]
  /** 是否隐藏 */
  hidden?: boolean
  /** 排序权重 */
  order?: number
}

/** 设置菜单项 */
export interface SettingsMenuItem {
  /** 菜单项键 */
  key: string
  /** 菜单项名称 */
  label: string
  /** 路由路径 */
  path: string
  /** 图标组件 */
  icon?: Component
}

// ==================== 菜单配置 ====================

/** 菜单项类型（Electron 菜单） */
export interface MenuItem {
  /** 菜单 ID */
  id: string
  /** 菜单标签 */
  label: string
  /** 子菜单 */
  submenu?: MenuItem[]
  /** 点击事件 */
  click?: () => void
  /** 快捷键 */
  accelerator?: string
  /** 角色 */
  role?: string
}

/** 应用菜单模板 */
export const APP_MENU_TEMPLATE = [
  {
    label: APP_NAME,
    submenu: [
      { role: 'about', label: `关于 ${APP_NAME}` },
      { type: 'separator' },
      { role: 'services', label: '服务' },
      { type: 'separator' },
      { role: 'hide', label: `隐藏 ${APP_NAME}` },
      { role: 'hideothers', label: '隐藏其他' },
      { role: 'unhide', label: '显示全部' },
      { type: 'separator' },
      { role: 'quit', label: '退出' },
    ],
  },
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
      { role: 'selectall', label: '全选' },
    ],
  },
  {
    label: '视图',
    submenu: [
      { role: 'reload', label: '重新加载' },
      { role: 'forceReload', label: '强制重新加载' },
      { role: 'toggleDevTools', label: '开发者工具' },
      { type: 'separator' },
      { role: 'resetZoom', label: '实际大小' },
      { role: 'zoomIn', label: '放大' },
      { role: 'zoomOut', label: '缩小' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: '全屏' },
    ],
  },
  {
    label: '窗口',
    submenu: [
      { role: 'minimize', label: '最小化' },
      { role: 'close', label: '关闭' },
      { type: 'separator' },
      { role: 'front', label: '全部置于顶层' },
    ],
  },
  {
    label: '帮助',
    submenu: [
      { label: '查看文档', click: () => {} },
      { label: '报告问题', click: () => {} },
    ],
  },
]
