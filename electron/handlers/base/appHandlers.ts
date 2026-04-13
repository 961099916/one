import { app, ipcMain, shell, dialog, BrowserWindow } from 'electron'
import log from 'electron-log'
import os from 'os'
import { IpcChannel } from '@common/constants'

export function initAppHandlers(): void {
  ipcMain.handle(IpcChannel.APP_GET_VERSION, () => {
    log.info('[IPC] 调用 APP_GET_VERSION')
    return app.getVersion()
  })

  ipcMain.handle(IpcChannel.APP_GET_ENV_INFO, () => {
    log.info('[IPC] 调用 APP_GET_ENV_INFO')
    return {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromiumVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
    }
  })

  ipcMain.handle(IpcChannel.APP_OPEN_LOG_DIR, () => {
    log.info('[IPC] 调用 APP_OPEN_LOG_DIR')
    const logPath = log.transports.file.getFile().path
    shell.showItemInFolder(logPath)
  })

  ipcMain.handle(IpcChannel.APP_RELAUNCH, () => {
    log.info('[IPC] 调用 APP_RELAUNCH')
    app.relaunch()
    app.exit(0)
  })

  ipcMain.handle(IpcChannel.APP_SET_LOGIN_ITEM, (_event, enabled: boolean) => {
    log.info('[IPC] 调用 APP_SET_LOGIN_ITEM, enabled:', enabled)
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
    })
    return { success: true }
  })

  ipcMain.handle(IpcChannel.APP_GET_LOGIN_ITEM, () => {
    log.info('[IPC] 调用 APP_GET_LOGIN_ITEM')
    return app.getLoginItemSettings().openAtLogin
  })

  ipcMain.handle(IpcChannel.APP_PROXY_FETCH, async (_event, url: string) => {
    log.info('[IPC] 调用 APP_PROXY_FETCH, URL:', url)
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (err: any) {
      log.error('[IPC] APP_PROXY_FETCH 失败:', err.message)
      return { error: err.message }
    }
  })

  ipcMain.handle(IpcChannel.APP_SELECT_DIRECTORY, async () => {
    log.info('[IPC] 调用 APP_SELECT_DIRECTORY')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle(IpcChannel.APP_GET_MAC_ADDRESS, () => {
    log.info('[IPC] 调用 APP_GET_MAC_ADDRESS')
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          return iface.mac
        }
      }
    }
    return 'UNKNOWN_MAC'
  })

  // ==================== 窗口控制 ====================

  ipcMain.handle(IpcChannel.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.handle(IpcChannel.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.maximize()
  })

  ipcMain.handle(IpcChannel.WINDOW_UNMAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.unmaximize()
  })

  ipcMain.handle(IpcChannel.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.handle(IpcChannel.WINDOW_IS_MAXIMIZED, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isMaximized()
  })

  ipcMain.handle(IpcChannel.WINDOW_SET_TITLEBAR_COLOR, (event, { color, symbolColor }) => {
    if (process.platform !== 'win32') return
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.setTitleBarOverlay({
      color,
      symbolColor,
      height: 32
    })
  })
}
