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
  getConfig(key: string): Promise<string | null>
  setConfig(key: string, value: string): Promise<unknown>
  getAllConfig(): Promise<Record<string, string>>
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
}

interface Window {
  /** 基础 IPC 桥（兼容旧代码） */
  ipcRenderer: import('electron').IpcRenderer
  /** 结构化 Electron API */
  electronAPI: {
    db: ElectronDbAPI
    app: ElectronAppAPI
    updater: ElectronUpdaterAPI
  }
}
