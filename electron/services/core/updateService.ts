/**
 * 自动更新服务
 */
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { BrowserWindow, Notification, app } from 'electron'
import { IpcChannel } from '../../constants'

export class UpdateService {
  private static instance: UpdateService
  private mainWindow: BrowserWindow | null = null

  private constructor() {
    this.setupListeners()
  }

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService()
    }
    return UpdateService.instance
  }

  /**
   * 初始化主窗口引用（用于发送事件）
   */
  init(window: BrowserWindow): void {
    this.mainWindow = window
    
    // 设置日志
    autoUpdater.logger = log
    // 禁止自动下载，由用户手动触发或确认
    autoUpdater.autoDownload = false

    // 强制在开发环境下使用开发更新配置
    if (!app.isPackaged) {
      autoUpdater.forceDevUpdateConfig = true
    }
    
    log.info('[UpdateService] 初始化完成')
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<void> {
    log.info('[UpdateService] 开始检查更新...')
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      log.error('[UpdateService] 检查更新时出错:', err)
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'error',
        message: '检查更新失败: ' + (err as Error).message
      })
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(): Promise<void> {
    log.info('[UpdateService] 开始下载更新...')
    try {
      await autoUpdater.downloadUpdate()
    } catch (err) {
      log.error('[UpdateService] 下载更新时出错:', err)
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'error',
        message: '下载更新失败'
      })
    }
  }

  /**
   * 退出并安装
   */
  quitAndInstall(): void {
    log.info('[UpdateService] 退出并安装更新...')
    autoUpdater.quitAndInstall()
  }

  /**
   * 设置事件监听
   */
  private setupListeners(): void {
    // 发现可用更新
    autoUpdater.on('update-available', (info) => {
      log.info('[UpdateService] 发现新版本:', info.version)
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'available',
        version: info.version,
        releaseNotes: info.releaseNotes
      })

      // 显示系统通知
      try {
        const notification = new Notification({
          title: 'One AI - 发现新版本',
          body: `新版本 v${info.version} 已可用，请前往“关于”页面更新。`,
          silent: false,
        })
        notification.on('click', () => {
          if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) this.mainWindow.restore()
            this.mainWindow.focus()
          }
        })
        notification.show()
      } catch (err) {
        log.error('[UpdateService] 发送通知失败:', err)
      }
    })

    // 没有可用更新
    autoUpdater.on('update-not-available', () => {
      log.info('[UpdateService] 当前已是最新版本')
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'not-available'
      })
    })

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'downloading',
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      })
    })

    // 下载完成
    autoUpdater.on('update-downloaded', () => {
      log.info('[UpdateService] 更新下载完成')
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'downloaded'
      })
    })

    // 错误处理
    autoUpdater.on('error', (err) => {
      log.error('[UpdateService] 更新过程中出错:', err)
      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'error',
        error: err.message
      })
    })
  }

  /**
   * 向渲染进程发送消息
   */
  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }
}
