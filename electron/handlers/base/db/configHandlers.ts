import { ipcMain } from 'electron'
import { appConfigOps } from '../../../infrastructure/store'
import { IpcChannel } from '@common/constants'
import log from 'electron-log'

export function initConfigHandlers(): void {
  ipcMain.handle(IpcChannel.CONFIG_GET, (_event, key: string) => {
    try {
      return appConfigOps.get(key as never)
    } catch (err) {
      log.error('[Config IPC] get 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CONFIG_SET, (_event, key: string, value: unknown) => {
    try {
      appConfigOps.set(key as never, value as never)
      return { success: true }
    } catch (err) {
      log.error('[Config IPC] set 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CONFIG_GET_ALL, () => {
    try {
      return appConfigOps.getAll()
    } catch (err) {
      log.error('[Config IPC] get-all 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.CONFIG_RESET, () => {
    try {
      appConfigOps.reset()
      return { success: true }
    } catch (err) {
      log.error('[Config IPC] reset 失败:', err)
      throw err
    }
  })
}
