/**
 * 自动更新 IPC 处理器
 */
import { ipcMain } from 'electron'
import { IpcChannel } from '../../constants'
import { UpdateService } from '../../services/core/updateService'
import log from 'electron-log'

export function initUpdateHandlers(): void {
  const updateService = UpdateService.getInstance()

  /** 检查更新 */
  ipcMain.handle(IpcChannel.UPDATE_CHECK, async () => {
    log.info('[IPC] 调用 UPDATE_CHECK')
    try {
      await updateService.checkForUpdates()
      return { success: true }
    } catch (err) {
      log.error('[Update IPC] check 失败:', err)
      throw err
    }
  })

  /** 下载更新 */
  ipcMain.handle(IpcChannel.UPDATE_DOWNLOAD, async () => {
    log.info('[IPC] 调用 UPDATE_DOWNLOAD')
    try {
      await updateService.downloadUpdate()
      return { success: true }
    } catch (err) {
      log.error('[Update IPC] download 失败:', err)
      throw err
    }
  })

  /** 安装并重启 */
  ipcMain.handle(IpcChannel.UPDATE_INSTALL, () => {
    log.info('[IPC] 调用 UPDATE_INSTALL')
    try {
      updateService.quitAndInstall()
      return { success: true }
    } catch (err) {
      log.error('[Update IPC] install 失败:', err)
      throw err
    }
  })
}
