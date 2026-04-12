/**
 * Electron 应用设置管理
 *
 * 使用 electron-store 管理用户设置、窗口状态等配置
 * 适合存储简单的键值对配置
 */
import Store from 'electron-store'
import { app } from 'electron'
import log from 'electron-log'

// ==================== 配置类型定义 ====================

export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

export interface GenerationParams {
  systemPrompt: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  contextSize: number
}

export interface ProxyConfig {
  enable: boolean
  protocol: 'http' | 'https' | 'socks5'
  host: string
  port: number
  auth?: {
    username?: string
    password?: string
  }
}

export interface AppConfig {
  // 窗口状态
  windowState: WindowState

  // 应用设置
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  fontSize: number
  sidebarWidth: number
  autoCheckUpdate: boolean
  enableTelemetry: boolean

  // 模型设置
  activeModel: string
  generationParams: GenerationParams

  // 聊天设置
  currentSessionId: string

  // 数据源设置
  tdxPath: string
  thsPath: string
  linkagePreference: 'tdx' | 'ths' | 'both'

  // 网络代理
  proxy: ProxyConfig
}

// ==================== 默认配置 ====================

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false,
}

const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  systemPrompt: 'You are a helpful local AI assistant. Please respond in Markdown format.',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  contextSize: 4096,
}

const defaultConfig: AppConfig = {
  windowState: DEFAULT_WINDOW_STATE,
  theme: 'auto',
  language: 'zh-CN',
  fontSize: 14,
  sidebarWidth: 240,
  autoCheckUpdate: true,
  enableTelemetry: false,
  activeModel: '',
  generationParams: DEFAULT_GENERATION_PARAMS,
  currentSessionId: '',
  tdxPath: '',
  thsPath: '',
  linkagePreference: 'tdx',
  proxy: {
    enable: false,
    protocol: 'http',
    host: '127.0.0.1',
    port: 7890
  }
}

// ==================== Store 实例 ====================

const store = new Store<AppConfig>({
  name: 'app-config',
  defaults: defaultConfig,
  cwd: app.getPath('userData'),
})

log.info('[AppConfig] 配置存储初始化完成')

// ==================== 窗口状态管理 ====================

export const windowStateOps = {
  /**
   * 加载窗口状态
   */
  load(): WindowState {
    const state = store.get('windowState')
    log.debug('[AppConfig] 加载窗口状态:', state)
    return state
  },

  /**
   * 保存窗口状态
   */
  save(state: WindowState): void {
    store.set('windowState', state)
    log.debug('[AppConfig] 保存窗口状态:', state)
  },
}

// ==================== 应用设置管理 ====================

export const appConfigOps = {
  /**
   * 获取所有配置
   */
  getAll(): AppConfig {
    return store.store as AppConfig
  },

  /**
   * 获取单个配置
   */
  get<K extends keyof AppConfig>(key: K, defaultValue?: AppConfig[K]): AppConfig[K] {
    const value = store.get(key)
    return value ?? defaultValue ?? defaultConfig[key]
  },

  /**
   * 设置配置
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    store.set(key, value)
    log.debug(`[AppConfig] 保存配置 ${String(key)}:`, value)
  },

  /**
   * 批量设置配置
   */
  setMany(updates: Partial<AppConfig>): void {
    for (const [key, value] of Object.entries(updates)) {
      store.set(key as keyof AppConfig, value)
    }
    log.debug('[AppConfig] 批量保存配置:', updates)
  },

  /**
   * 删除配置
   */
  delete(key: keyof AppConfig): void {
    store.delete(key)
  },

  /**
   * 重置为默认配置
   */
  reset(): void {
    store.clear()
    store.set(defaultConfig)
    log.info('[AppConfig] 配置已重置为默认值')
  },
}

// ==================== 模型设置管理 ====================

export const modelConfigOps = {
  /**
   * 获取当前激活的模型
   */
  getActiveModel(): string {
    return store.get('activeModel', '')
  },

  /**
   * 设置当前激活的模型
   */
  setActiveModel(modelName: string): void {
    store.set('activeModel', modelName)
  },

  /**
   * 获取生成参数
   */
  getGenerationParams(): GenerationParams {
    return store.get('generationParams', DEFAULT_GENERATION_PARAMS)
  },

  /**
   * 设置生成参数
   */
  setGenerationParams(params: Partial<GenerationParams>): void {
    const current = modelConfigOps.getGenerationParams()
    store.set('generationParams', { ...current, ...params })
  },

  /**
   * 重置生成参数
   */
  resetGenerationParams(): void {
    store.set('generationParams', DEFAULT_GENERATION_PARAMS)
  },
}

// ==================== 聊天设置管理 ====================

export const chatConfigOps = {
  /**
   * 获取当前会话 ID
   */
  getCurrentSessionId(): string {
    return store.get('currentSessionId', '')
  },

  /**
   * 设置当前会话 ID
   */
  setCurrentSessionId(sessionId: string): void {
    store.set('currentSessionId', sessionId)
  },
}

export default store
