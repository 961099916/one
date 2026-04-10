import { app, ipcMain, shell } from 'electron'
import log from 'electron-log'
import { IpcChannel } from '../../constants'

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

}
