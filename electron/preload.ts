import { ipcRenderer, contextBridge } from 'electron'
import type { IpcRendererEvent } from 'electron'

/**
 * 预加载脚本
 * 通过 contextBridge 向渲染进程暴露安全的主进程 API
 */

// ==================== 基础 IPC 桥（保留兼容） ====================

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    return ipcRenderer.off(channel, listener)
  },
  send(channel: string, ...args: unknown[]) {
    return ipcRenderer.send(channel, ...args)
  },
  invoke(channel: string, ...args: unknown[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
  removeAllListeners(channel: string) {
    return ipcRenderer.removeAllListeners(channel)
  },
})

// ==================== 结构化 API（大厂规范） ====================

contextBridge.exposeInMainWorld('electronAPI', {
  // ---------- 数据库操作（SQLite via 主进程） ----------
  db: {
    getSessions: () => ipcRenderer.invoke('db:get-sessions'),
    createSession: (session: unknown) => ipcRenderer.invoke('db:create-session', session),
    updateSession: (id: string, updates: unknown) =>
      ipcRenderer.invoke('db:update-session', id, updates),
    deleteSession: (id: string) => ipcRenderer.invoke('db:delete-session', id),

    getMessages: (sessionId: string) => ipcRenderer.invoke('db:get-messages', sessionId),
    addMessage: (sessionId: string, role: string, content: string, createdAt: number) =>
      ipcRenderer.invoke('db:add-message', sessionId, role, content, createdAt),
    updateLastMessage: (sessionId: string, content: string) =>
      ipcRenderer.invoke('db:update-last-message', sessionId, content),
    clearMessages: (sessionId: string) => ipcRenderer.invoke('db:clear-messages', sessionId),
    getMarketData: (params: unknown) => ipcRenderer.invoke('db:get-market-data', params),
    syncMarketData: (params: unknown) => ipcRenderer.invoke('db:sync-market-data', params),
    getAllTradingDays: () => ipcRenderer.invoke('db:get-all-trading-days'),
    updateTradingDay: (params: { date: string, isTrading: boolean }) => 
      ipcRenderer.invoke('db:update-trading-day', params),
    getStockPool: (params: { poolName: string, date: string }) => 
      ipcRenderer.invoke('db:get-stock-pool', params),
    syncStockPool: (params: { poolName: string, date: string }) => 
      ipcRenderer.invoke('db:sync-stock-pool', params),
    batchSyncXuanguBao: (params: { startDate: string, endDate: string, force?: boolean }) =>
      ipcRenderer.invoke('db:batch-sync-xuangubao', params),
    getSurgePlates: (params: { date: string, timestamp?: number }) => 
      ipcRenderer.invoke('db:get-surge-plates', params),
    getSurgeStocks: (params: { date: string, timestamp?: number }) => 
      ipcRenderer.invoke('db:get-surge-stocks', params),
    syncSurgeData: (date: string) => ipcRenderer.invoke('db:sync-surge-data', date),
    getLatestSurgeTimestamp: (date: string) => ipcRenderer.invoke('db:get-latest-surge-timestamp', date),
    getSurgeTimestamps: (date: string) => ipcRenderer.invoke('db:get-surge-timestamps', date),
    getSurgeHistoricalDates: () => ipcRenderer.invoke('db:get-surge-historical-dates'),
    getSentimentCycle: (params: unknown) => ipcRenderer.invoke('db:get-sentiment-cycle', params),
  },

  // ---------- 配置操作（electron-store via 主进程） ----------
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:get-all'),
    reset: () => ipcRenderer.invoke('config:reset'),
  },

  // ---------- 文件操作（userData 目录） ----------
  file: {
    save: (sourcePath: string, originalName: string) =>
      ipcRenderer.invoke('file:save', sourcePath, originalName),
    saveImage: (sourcePath: string, originalName: string) =>
      ipcRenderer.invoke('file:save-image', sourcePath, originalName),
    saveBase64Image: (base64Data: string, extension?: string) =>
      ipcRenderer.invoke('file:save-base64-image', base64Data, extension),
    getPath: (relativePath: string) => ipcRenderer.invoke('file:get-path', relativePath),
    exists: (relativePath: string) => ipcRenderer.invoke('file:exists', relativePath),
    delete: (relativePath: string) => ipcRenderer.invoke('file:delete', relativePath),
    read: (relativePath: string) => ipcRenderer.invoke('file:read', relativePath),
  },

  // ---------- 应用操作 ----------
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getEnvInfo: () => ipcRenderer.invoke('app:get-env-info'),
    openLogDir: () => ipcRenderer.invoke('app:open-log-dir'),
    relaunch: () => ipcRenderer.invoke('app:relaunch'),
    setLoginItem: (enabled: boolean) => ipcRenderer.invoke('app:set-login-item', enabled),
    getLoginItem: () => ipcRenderer.invoke('app:get-login-item'),
    proxyFetch: (url: string) => ipcRenderer.invoke('app:proxy-fetch', url),
    selectDirectory: () => ipcRenderer.invoke('app:select-directory'),
  },

  // ---------- 自动更新 ----------
  updater: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    /** 监听更新状态推送（主进程 → 渲染进程） */
    onStatus: (
      callback: (data: {
        status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
        version?: string
        releaseNotes?: string
        progress?: number
        message?: string
      }) => void
    ) => {
      const listener = (_event: any, data: any) => callback(data)
      ipcRenderer.on('update:status', listener)
      return () => ipcRenderer.removeListener('update:status', listener)
    },
    offStatus: () => {
      ipcRenderer.removeAllListeners('update:status')
    },
  },

  // ---------- 通达信本地数据 ----------
  tdx: {
    getMinuteData: (params: { tdxPath: string; symbol: string; date: string; period?: '1' | '5' }) =>
      ipcRenderer.invoke('tdx:get-minute-data', params),
    openStock: (symbol: string) =>
      ipcRenderer.invoke('tdx:open-stock', symbol),
  },
})
