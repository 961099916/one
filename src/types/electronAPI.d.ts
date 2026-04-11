/**
 * electronAPI 类型定义
 */

export interface ElectronDbAPI {
  getSessions: () => Promise<Array<{
    id: string
    title: string
    created_at: number
    updated_at: number
  }>>
  createSession: (session: {
    id: string
    title: string
    created_at: number
    updated_at: number
  }) => Promise<{ success: boolean }>
  updateSession: (id: string, updates: Partial<{
    title: string
    updated_at: number
  }>) => Promise<{ success: boolean }>
  deleteSession: (id: string) => Promise<{ success: boolean }>

  getMessages: (sessionId: string) => Promise<Array<{
    id: number
    session_id: string
    role: string
    content: string
    created_at: number
  }>>
  addMessage: (sessionId: string, role: string, content: string, createdAt: number) => Promise<{
    success: boolean
    id: number
  }>
  updateLastMessage: (sessionId: string, content: string) => Promise<{ success: boolean }>
  clearMessages: (sessionId: string) => Promise<{ success: boolean }>
  
  // 市场数据与情绪指标
  getMarketData: (payload?: { startDate: string, endDate: string }) => Promise<any[]>
  syncMarketData: (payload?: { startDate: string, endDate: string, force?: boolean }) => Promise<{ success: boolean; count?: number }>
  getAllTradingDays: () => Promise<any[]>
  updateTradingDay: (params: { date: string, isTrading: boolean }) => Promise<{ success: boolean }>
  
  // 股票池与聚合
  getStockPool: (params: { poolName: string, date: string }) => Promise<any[]>
  syncStockPool: (params: { poolName: string, date: string }) => Promise<{ success: boolean }>
  batchSyncXuanguBao: (payload: { startDate: string, endDate: string, force?: boolean }) => Promise<any>
  getSentimentCycle: (params?: { limit?: number }) => Promise<{
    days: string[]
    stats: any[]
    poolRecords: any[]
  }>

  // 每日热点专题 (Surge)
  getSurgePlates: (params: { date: string, timestamp?: number }) => Promise<any[]>
  getSurgeStocks: (params: { date: string, timestamp?: number }) => Promise<any[]>
  getSurgeTimestamps: (date: string) => Promise<number[]>
  getSurgeHistoricalDates: () => Promise<string[]>
  syncSurgeData: (date: string) => Promise<{ success: boolean }>
  getLatestSurgeTimestamp: (date: string) => Promise<number | null>
}

export interface ElectronAPI {
  // 数据库操作（SQLite）
  db: ElectronDbAPI

  // 配置操作（electron-store）
  config: {
    get: <T>(key: string) => Promise<T>
    set: (key: string, value: unknown) => Promise<{ success: boolean }>
    getAll: () => Promise<AppConfig>
    reset: () => Promise<{ success: boolean }>
  }

  // 文件操作
  file: {
    save: (sourcePath: string, originalName: string) => Promise<{ success: boolean; path: string }>
    saveImage: (sourcePath: string, originalName: string) => Promise<{ success: boolean; path: string }>
    saveBase64Image: (base64Data: string, extension?: string) => Promise<{ success: boolean; path: string }>
    getPath: (relativePath: string) => Promise<string>
    exists: (relativePath: string) => Promise<boolean>
    delete: (relativePath: string) => Promise<{ success: boolean }>
    read: (relativePath: string) => Promise<{ success: boolean; data: string }>
  }

  // 应用操作
  app: {
    getVersion: () => Promise<string>
    getEnvInfo: () => Promise<{
      appVersion: string
      electronVersion: string
      nodeVersion: string
      chromiumVersion: string
      platform: string
      arch: string
    }>
    openLogDir: () => Promise<void>
    relaunch: () => Promise<void>
    setLoginItem: (enabled: boolean) => Promise<{ success: boolean }>
    getLoginItem: () => Promise<boolean>
  }

  // 自动更新
  updater: {
    check: () => Promise<unknown>
    download: () => Promise<unknown>
    install: () => Promise<unknown>
    onStatus: (callback: (data: {
      status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
      version?: string
      releaseNotes?: string
      progress?: number
      message?: string
    }) => void) => () => void
    offStatus: () => void
  }
}

export interface AppConfig {
  windowState: {
    x?: number
    y?: number
    width: number
    height: number
    isMaximized: boolean
  }
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  fontSize: number
  sidebarWidth: number
  autoCheckUpdate: boolean
  enableTelemetry: boolean
  activeModel: string
  generationParams: {
    systemPrompt: string
    temperature: number
    topP: number
    topK: number
    maxTokens: number
    contextSize: number
  }
  currentSessionId: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
