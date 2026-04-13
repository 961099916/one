/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

// ==================== electronAPI 类型声明 ====================

interface ElectronDbAPI {
  getSessions(): Promise<unknown[]>
  createSession(session: unknown): Promise<unknown>
  updateSession(id: string, updates: unknown): Promise<unknown>
  deleteSession(id: string): Promise<unknown>
  getMessages(sessionId: string): Promise<unknown[]>
  addMessage(sessionId: string, role: string, content: string, createdAt: number): Promise<unknown>
  updateLastMessage(sessionId: string, content: string): Promise<unknown>
  clearMessages(sessionId: string): Promise<unknown>
  getMarketData(params: unknown): Promise<unknown>
  syncMarketData(params: unknown): Promise<unknown>
  getAllTradingDays(): Promise<string[]>
  updateTradingDay(params: { date: string; isTrading: boolean }): Promise<unknown>
  getStockPool(params: { poolName: string; date: string }): Promise<unknown>
  syncStockPool(params: { poolName: string; date: string }): Promise<unknown>
  batchSyncXuanguBao(params: { startDate: string; endDate: string; force?: boolean }): Promise<unknown>
  getSurgePlates(params: { date: string; timestamp?: number }): Promise<unknown>
  getSurgeStocks(params: { date: string; timestamp?: number }): Promise<unknown>
  syncSurgeData(date: string): Promise<unknown>
  getLatestSurgeTimestamp(date: string): Promise<number>
  getSurgeTimestamps(date: string): Promise<number[]>
  getSurgeHistoricalDates(): Promise<string[]>
  getSentimentCycle(params: unknown): Promise<unknown>
  getLatestTradingDay(): Promise<string>
}

interface UpdateStatusPayload {
  type: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  releaseNotes?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  error?: string
}

interface ElectronUpdaterAPI {
  check(): Promise<unknown>
  download(): Promise<unknown>
  install(): Promise<void>
  onStatus(callback: (status: UpdateStatusPayload) => void): void
  offStatus(): void
}

interface ElectronEnvInfo {
  appVersion: string
  electronVersion: string
  nodeVersion: string
  chromiumVersion: string
  platform: string
  arch: string
}

interface ElectronAppAPI {
  getVersion(): Promise<string>
  getEnvInfo(): Promise<ElectronEnvInfo>
  openLogDir(): Promise<void>
  relaunch(): Promise<void>
  setLoginItem(enabled: boolean): Promise<unknown>
  getLoginItem(): Promise<boolean>
  proxyFetch(url: string): Promise<any>
  selectDirectory(): Promise<string | null>
  getMacAddress(): Promise<string>
}

interface ElectronConfigAPI {
  get(key: string): Promise<any>
  set(key: string, value: unknown): Promise<void>
  getAll(): Promise<any>
  reset(): Promise<void>
}

interface ElectronFileAPI {
  save(sourcePath: string, originalName: string): Promise<string>
  saveImage(sourcePath: string, originalName: string): Promise<string>
  saveBase64Image(base64Data: string, extension?: string): Promise<string>
  getPath(relativePath: string): Promise<string>
  exists(relativePath: string): Promise<boolean>
  delete(relativePath: string): Promise<void>
  read(relativePath: string): Promise<string | Buffer>
}

interface ElectronWindowAPI {
  minimize(): Promise<void>
  maximize(): Promise<void>
  unmaximize(): Promise<void>
  close(): Promise<void>
  isMaximized(): Promise<boolean>
  setTitlebarColor(color: string, symbolColor: string): Promise<void>
}

interface ElectronTdxAPI {
  getMinuteData(params: { tdxPath: string; symbol: string; date: string; period?: '1' | '5' }): Promise<any>
  openStock(symbol: string): Promise<void>
}

interface ElectronThsAPI {
  openStock(symbol: string): Promise<void>
}

interface Window {
  /** 基础 IPC 桥（兼容旧代码） */
  ipcRenderer: import('electron').IpcRenderer
  /** 结构化 Electron API */
  electronAPI: {
    db: ElectronDbAPI
    app: ElectronAppAPI
    updater: ElectronUpdaterAPI
    config: ElectronConfigAPI
    file: ElectronFileAPI
    tdx: ElectronTdxAPI
    ths: ElectronThsAPI
    window: ElectronWindowAPI
  }
}
