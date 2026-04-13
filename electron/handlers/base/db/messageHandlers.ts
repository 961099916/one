import { ipcMain } from 'electron'
import { messageOps } from '../../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import log from 'electron-log'

export function initMessageHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_MESSAGES, (_event, sessionId: string) => {
    try {
      return messageOps.getBySession(sessionId)
    } catch (err) {
      log.error('[DB IPC] get-messages 失败:', err)
      throw err
    }
  })

  ipcMain.handle(
    IpcChannel.DB_ADD_MESSAGE,
    (_event, sessionId: string, role: string, content: string, createdAt: number) => {
      try {
        const id = messageOps.add(sessionId, role, content, createdAt)
        return { success: true, id }
      } catch (err) {
        log.error('[DB IPC] add-message 失败:', err)
        throw err
      }
    }
  )

  ipcMain.handle(
    IpcChannel.DB_UPDATE_LAST_MESSAGE,
    (_event, sessionId: string, content: string) => {
      try {
        messageOps.updateLastContent(sessionId, content)
        return { success: true }
      } catch (err) {
        log.error('[DB IPC] update-last-message 失败:', err)
        throw err
      }
    }
  )

  ipcMain.handle(IpcChannel.DB_CLEAR_MESSAGES, (_event, sessionId: string) => {
    try {
      messageOps.deleteBySession(sessionId)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] clear-messages 失败:', err)
      throw err
    }
  })
}
