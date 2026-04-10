/**
 * Electron 服务
 * 封装底层的 IPC 通信，隔离渲染进程与主进程的交互细节
 */

class ElectronService {
  /**
   * 发送异步消息到主进程
   */
  send(channel: string, ...args: any[]): void {
    if (window.ipcRenderer) {
      window.ipcRenderer.send(channel, ...args)
    }
  }

  /**
   * 调用主进程方法并等待结果
   */
  async invoke<T>(channel: string, ...args: any[]): Promise<T> {
    if (!window.ipcRenderer) {
      throw new Error('ipcRenderer is not available')
    }
    return window.ipcRenderer.invoke(channel, ...args) as Promise<T>
  }

  /**
   * 监听主进程消息
   */
  on(channel: string, listener: (...args: any[]) => void): () => void {
    if (!window.ipcRenderer) return () => {}

    const wrappedListener = (_event: any, ...args: any[]) => listener(...args)
    window.ipcRenderer.on(channel, wrappedListener)

    // 返回取消监听的方法
    return () => {
      window.ipcRenderer.off(channel, wrappedListener)
    }
  }

  /**
   * 访问 Electron API
   */
  get api() {
    return window.electronAPI
  }

  /**
   * 检查是否在 Electron 环境
   */
  get isElectron(): boolean {
    return !!window.electronAPI
  }
}

export const electronService = new ElectronService()
