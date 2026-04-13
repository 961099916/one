import { ipcRenderer, contextBridge } from 'electron'
import type { IpcRendererEvent } from 'electron'
import { IpcChannel } from '@common/constants'

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
    getSessions: () => ipcRenderer.invoke(IpcChannel.DB_GET_SESSIONS),
    createSession: (session: unknown) => ipcRenderer.invoke(IpcChannel.DB_CREATE_SESSION, session),
    updateSession: (id: string, updates: unknown) =>
      ipcRenderer.invoke(IpcChannel.DB_UPDATE_SESSION, id, updates),
    deleteSession: (id: string) => ipcRenderer.invoke(IpcChannel.DB_DELETE_SESSION, id),

    getMessages: (sessionId: string) => ipcRenderer.invoke(IpcChannel.DB_GET_MESSAGES, sessionId),
    addMessage: (sessionId: string, role: string, content: string, createdAt: number) =>
      ipcRenderer.invoke(IpcChannel.DB_ADD_MESSAGE, sessionId, role, content, createdAt),
    updateLastMessage: (sessionId: string, content: string) =>
      ipcRenderer.invoke(IpcChannel.DB_UPDATE_LAST_MESSAGE, sessionId, content),
    clearMessages: (sessionId: string) => ipcRenderer.invoke(IpcChannel.DB_CLEAR_MESSAGES, sessionId),
    getMarketData: (params: unknown) => ipcRenderer.invoke(IpcChannel.DB_GET_MARKET_DATA, params),
    syncMarketData: (params: unknown) => ipcRenderer.invoke(IpcChannel.DB_SYNC_MARKET_DATA, params),
    getAllTradingDays: () => ipcRenderer.invoke(IpcChannel.DB_GET_ALL_TRADING_DAYS),
    updateTradingDay: (params: { date: string, isTrading: boolean }) => 
      ipcRenderer.invoke(IpcChannel.DB_UPDATE_TRADING_DAY, params),
    getStockPool: (params: { poolName: string, date: string }) => 
      ipcRenderer.invoke(IpcChannel.DB_GET_STOCK_POOL, params),
    syncStockPool: (params: { poolName: string, date: string }) => 
      ipcRenderer.invoke(IpcChannel.DB_SYNC_STOCK_POOL, params),
    batchSyncXuanguBao: (params: { startDate: string, endDate: string, force?: boolean }) =>
      ipcRenderer.invoke(IpcChannel.DB_BATCH_SYNC_XUANGUBAO, params),
    getSurgePlates: (params: { date: string, timestamp?: number }) => 
      ipcRenderer.invoke(IpcChannel.DB_GET_SURGE_PLATES, params),
    getSurgeStocks: (params: { date: string, timestamp?: number }) => 
      ipcRenderer.invoke(IpcChannel.DB_GET_SURGE_STOCKS, params),
    syncSurgeData: (date: string) => ipcRenderer.invoke(IpcChannel.DB_SYNC_SURGE_DATA, date),
    getLatestSurgeTimestamp: (date: string) => ipcRenderer.invoke(IpcChannel.DB_GET_LATEST_SURGE_TIMESTAMP, date),
    getSurgeTimestamps: (date: string) => ipcRenderer.invoke(IpcChannel.DB_GET_SURGE_TIMESTAMPS, date),
    getSurgeHistoricalDates: () => ipcRenderer.invoke(IpcChannel.DB_GET_SURGE_HISTORICAL_DATES),
    getSentimentCycle: (params: unknown) => ipcRenderer.invoke(IpcChannel.DB_GET_SENTIMENT_CYCLE, params),
    getLatestTradingDay: () => ipcRenderer.invoke(IpcChannel.DB_GET_LATEST_TRADING_DAY),
  },

  // ---------- 配置操作（electron-store via 主进程） ----------
  config: {
    get: (key: string) => ipcRenderer.invoke(IpcChannel.CONFIG_GET, key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(IpcChannel.CONFIG_SET, key, value),
    getAll: () => ipcRenderer.invoke(IpcChannel.CONFIG_GET_ALL),
    reset: () => ipcRenderer.invoke(IpcChannel.CONFIG_RESET),
  },

  // ---------- 文件操作（userData 目录） ----------
  file: {
    save: (sourcePath: string, originalName: string) =>
      ipcRenderer.invoke(IpcChannel.FILE_SAVE, sourcePath, originalName),
    saveImage: (sourcePath: string, originalName: string) =>
      ipcRenderer.invoke(IpcChannel.FILE_SAVE_IMAGE, sourcePath, originalName),
    saveBase64Image: (base64Data: string, extension?: string) =>
      ipcRenderer.invoke(IpcChannel.FILE_SAVE_BASE64_IMAGE, base64Data, extension),
    getPath: (relativePath: string) => ipcRenderer.invoke(IpcChannel.FILE_GET_PATH, relativePath),
    exists: (relativePath: string) => ipcRenderer.invoke(IpcChannel.FILE_EXISTS, relativePath),
    delete: (relativePath: string) => ipcRenderer.invoke(IpcChannel.FILE_DELETE, relativePath),
    read: (relativePath: string) => ipcRenderer.invoke(IpcChannel.FILE_READ, relativePath),
  },

  // ---------- 应用操作 ----------
  app: {
    getVersion: () => ipcRenderer.invoke(IpcChannel.APP_GET_VERSION),
    getEnvInfo: () => ipcRenderer.invoke(IpcChannel.APP_GET_ENV_INFO),
    openLogDir: () => ipcRenderer.invoke(IpcChannel.APP_OPEN_LOG_DIR),
    relaunch: () => ipcRenderer.invoke(IpcChannel.APP_RELAUNCH),
    setLoginItem: (enabled: boolean) => ipcRenderer.invoke(IpcChannel.APP_SET_LOGIN_ITEM, enabled),
    getLoginItem: () => ipcRenderer.invoke(IpcChannel.APP_GET_LOGIN_ITEM),
    proxyFetch: (url: string) => ipcRenderer.invoke(IpcChannel.APP_PROXY_FETCH, url),
    selectDirectory: () => ipcRenderer.invoke(IpcChannel.APP_SELECT_DIRECTORY),
    getMacAddress: () => ipcRenderer.invoke(IpcChannel.APP_GET_MAC_ADDRESS),
  },

  // ---------- 自动更新 ----------
  updater: {
    check: () => ipcRenderer.invoke(IpcChannel.UPDATE_CHECK),
    download: () => ipcRenderer.invoke(IpcChannel.UPDATE_DOWNLOAD),
    install: () => ipcRenderer.invoke(IpcChannel.UPDATE_INSTALL),
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
      ipcRenderer.on(IpcChannel.UPDATE_STATUS, listener)
      return () => ipcRenderer.removeListener(IpcChannel.UPDATE_STATUS, listener)
    },
    offStatus: () => {
      ipcRenderer.removeAllListeners(IpcChannel.UPDATE_STATUS)
    },
  },

  // ---------- 通达信本地数据 ----------
  tdx: {
    getMinuteData: (params: { tdxPath: string; symbol: string; date: string; period?: '1' | '5' }) =>
      ipcRenderer.invoke(IpcChannel.TDX_GET_MINUTE_DATA, params),
    openStock: (symbol: string) =>
      ipcRenderer.invoke(IpcChannel.TDX_OPEN_STOCK, symbol),
  },
  // ---------- 同花顺联动 ----------
  ths: {
    openStock: (symbol: string) =>
      ipcRenderer.invoke(IpcChannel.OPEN_TONGHUASHUN_STOCK, symbol),
  },

  // ---------- 窗口控制 ----------
  window: {
    minimize: () => ipcRenderer.invoke(IpcChannel.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IpcChannel.WINDOW_MAXIMIZE),
    unmaximize: () => ipcRenderer.invoke(IpcChannel.WINDOW_UNMAXIMIZE),
    close: () => ipcRenderer.invoke(IpcChannel.WINDOW_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IpcChannel.WINDOW_IS_MAXIMIZED),
    setTitlebarColor: (color: string, symbolColor: string) => 
      ipcRenderer.invoke(IpcChannel.WINDOW_SET_TITLEBAR_COLOR, { color, symbolColor }),
  },
})
