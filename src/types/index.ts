/**
 * 应用类型定义
 */

// ==================== 聊天相关 ====================

/** 消息角色类型 */
export type MessageRole = 'user' | 'assistant' | 'system'

/** 聊天消息接口 */
export interface ChatMessage {
  role: MessageRole
  content: string
}

// ==================== 模型相关 ====================

/** 模型信息接口 */
export interface ModelInfo {
  name: string
  path: string
}

/** 预设模型配置 */
export interface ModelPreset {
  name: string
  displayName: string
  modelId: string
  url: string
  filename: string
}

/** 生成参数配置 */
export interface GenerationParams {
  /** 系统提示词 */
  systemPrompt: string
  /** 温度：控制随机性，0-2 之间 */
  temperature: number
  /** Top P：核采样参数 */
  topP: number
  /** Top K：从概率最高的 K 个 token 中采样 */
  topK: number
  /** 最大生成 token 数 */
  maxTokens: number
  /** 上下文窗口大小 */
  contextSize: number
}

// ==================== 下载相关 ====================

/** 下载进度接口 */
export interface DownloadProgress {
  name: string
  progress: number
}

/** 下载完成结果接口 */
export interface DownloadResult {
  success: boolean
  name?: string
  error?: string
}

/** 代理配置接口 */
export interface ProxyConfig {
  enable: boolean
  protocol: 'http' | 'https' | 'socks5'
  host: string
  port: number
}

/** 应用设置接口 */
export interface AppSettings {
  /** 主题设置 */
  theme: 'light' | 'dark' | 'auto'
  /** 语言设置 */
  language: 'zh-CN' | 'en-US'
  /** 是否自动检查更新 */
  autoCheckUpdate: boolean
  /** 是否发送遥测数据 */
  enableTelemetry: boolean
  /** 消息字体大小 */
  fontSize: number
  /** 侧边栏宽度 */
  sidebarWidth: number
  /** 启动时是否自动加载上次的模型 */
  autoLoadModel: boolean
  /** 通达信数据路径 (vipdoc 目录) */
  tdxPath: string
  /** 同花顺安装路径 (hexin.exe) */
  thsPath: string
  /** 联动偏好设置 */
  linkagePreference: 'tdx' | 'ths' | 'both'
  /** 网络代理设置 */
  proxy: ProxyConfig
  /** 更新镜像设置 */
  updateMirror: 'direct' | 'ghproxy' | 'custom'
  /** 自定义镜像地址 */
  customMirrorUrl: string
}

/** 窗口状态接口 */
export interface WindowState {
  /** 窗口宽度 */
  width: number
  /** 窗口高度 */
  height: number
  /** 窗口 X 坐标 */
  x?: number
  /** 窗口 Y 坐标 */
  y?: number
  /** 是否最大化 */
  isMaximized: boolean
}

// ==================== IPC 相关 ====================

/** IPC 事件通道常量 */
export const IpcChannel = {
  // 模型相关
  LIST_MODELS: 'list-models',
  DOWNLOAD_MODEL: 'download-model',
  DELETE_MODEL: 'delete-model',
  IMPORT_MODEL: 'import-model',
  SET_ACTIVE_MODEL: 'set-active-model',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',

  // 聊天相关
  START_CHAT: 'start-chat',
  STOP_CHAT: 'stop-chat',
  CHAT_TOKEN: 'chat-token',
  CHAT_END: 'chat-end',
  CHAT_ERROR: 'chat-error',

  // 系统相关
  MAIN_PROCESS_MESSAGE: 'main-process-message',

  // 应用相关
  OPEN_EXTERNAL_URL: 'open-external-url',
  MINIMIZE_WINDOW: 'minimize-window',
  MAXIMIZE_WINDOW: 'maximize-window',
  CLOSE_WINDOW: 'close-window',
} as const

export type IpcChannelType = (typeof IpcChannel)[keyof typeof IpcChannel]
