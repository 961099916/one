/**
 * 自动更新服务
 */
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { BrowserWindow, Notification, app } from 'electron'
import { IpcChannel } from '@common/constants'
import { appConfigOps } from '../../infrastructure/store'

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
    
    // 应用镜像设置
    try {
      this.applyUpdateMirror()
    } catch (err) {
      log.error('[UpdateService] 应用镜像设置失败:', err)
    }

    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      log.error('[UpdateService] 检查更新时出错:', err)
      
      const errMsg = (err as Error).message || ''
      let userFriendlyMsg = '检查更新失败'
      
      if (errMsg.includes('net::ERR_CONNECTION_CLOSED') || errMsg.includes('net::ERR_CONNECTION_TIMED_OUT')) {
        userFriendlyMsg = '无法连接更新服务器，请尝试开启“GitHub 下载镜像”或检查网络代理。'
      }

      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'error',
        message: userFriendlyMsg,
        error: errMsg
      })
    }
  }

  /**
   * 应用更新镜像设置
   */
  private applyUpdateMirror(): void {
    const config = appConfigOps.getAll()
    const mirror = config.updateMirror || 'direct'
    
    // 获取 GitHub 仓库信息 (从 package.json 或 hardcode)
    const owner = '961099916'
    const repo = 'one'
    
    if (mirror === 'ghproxy') {
      // 使用 ghproxy 代理 GitHub Releases
      // 目标 URL 结构: https://mirror.ghproxy.com/https://github.com/owner/repo/releases/latest/download/latest.yml
      const mirrorUrl = `https://mirror.ghproxy.com/https://github.com/${owner}/${repo}/releases/latest/download/`
      log.info(`[UpdateService] 正在使用 GitHub 镜像 (ghproxy): ${mirrorUrl}`)
      
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: mirrorUrl
      })
    } else if (mirror === 'custom' && config.customMirrorUrl) {
      log.info(`[UpdateService] 正在使用自定义镜像: ${config.customMirrorUrl}`)
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: config.customMirrorUrl
      })
    } else {
      log.info('[UpdateService] 正在使用默认更新源 (GitHub Direct)')
      // 如果是 direct 且之前设置过 generic，需要恢复默认(由于 electron-updater 机制，可能需要从 app-update.yml 重新加载)
      // 但通常重启应用后会恢复默认，或者在此显式按 github 重新设回
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
    // 参数说明: isSilent=false, isForceRunAfter=true (确保安装后立即重启)
    autoUpdater.quitAndInstall(false, true)
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
          title: '壹复盘 - 发现新版本',
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
      
      const errMsg = err.message || ''
      let userFriendlyMsg = '更新过程中出现错误'

      if (errMsg.includes('net::ERR_CONNECTION_CLOSED') || errMsg.includes('net::ERR_CONNECTION_TIMED_OUT')) {
        userFriendlyMsg = '连接更新服务器失败，请检查网络连接或尝试配置代理。'
      } else if (errMsg.includes('handshake failed') || errMsg.includes('SSL')) {
        userFriendlyMsg = '安全连接建立失败 (SSL Error)，请检查系统代理设置。'
      }

      // 特殊处理 macOS 签名校验失败
      const isAuthError = errMsg.includes('Code signature') || 
                          errMsg.includes('validation') ||
                          errMsg.includes('ShipIt')

      this.sendToRenderer(IpcChannel.UPDATE_STATUS, {
        status: 'error',
        message: userFriendlyMsg,
        error: errMsg,
        isAuthError: isAuthError && process.platform === 'darwin'
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
