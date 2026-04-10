/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<unknown, unknown, unknown>
  export default component
}

/**
 * 全局类型声明
 */

import type { IpcRendererEvent } from 'electron'
import type { ElectronAPI } from './types/electronAPI'

declare global {
  interface Window {
    ipcRenderer: {
      on(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void
      off(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void
      send(channel: string, ...args: unknown[]): void
      invoke(channel: string, ...args: unknown[]): Promise<unknown>
      removeAllListeners(channel: string): void
    }
    electronAPI: ElectronAPI
  }
}
