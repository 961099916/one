import { ipcMain } from 'electron'
import { sessionOps } from '../../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import log from 'electron-log'

export function initSessionHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_SESSIONS, () => {
    try {
      return sessionOps.getAll()
    } catch (err) {
      log.error('[DB IPC] get-sessions 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_CREATE_SESSION, (_event, session) => {
    try {
      sessionOps.create(session)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] create-session 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_UPDATE_SESSION, (_event, id: string, updates) => {
    try {
      sessionOps.update(id, updates)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] update-session 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_DELETE_SESSION, (_event, id: string) => {
    try {
      sessionOps.delete(id)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] delete-session 失败:', err)
      throw err
    }
  })
}
