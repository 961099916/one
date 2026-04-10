/**
 * 数据库 IPC 处理器
 *
 * 将 SQLite 和 electron-store 操作通过 IPC 暴露给渲染进程
 * 渲染进程通过 window.electronAPI.db.* 和 window.electronAPI.config.* 调用
 */
import { ipcMain } from 'electron'
import { sessionOps, messageOps, marketDataOps } from '../../infrastructure/database'
import { appConfigOps } from '../../infrastructure/store'
import { IpcChannel } from '../../constants'
import { XuanguBaoService } from '../../services/integration/xuangubaoService'
import log from 'electron-log'

/**
 * 初始化数据库 IPC 处理器
 */
export function initDbHandlers(): void {
  // ==================== 会话操作（SQLite） ====================

  /** 获取所有会话 */
  ipcMain.handle(IpcChannel.DB_GET_SESSIONS, () => {
    log.info('[IPC] 调用 DB_GET_SESSIONS')
    try {
      return sessionOps.getAll()
    } catch (err) {
      log.error('[DB IPC] get-sessions 失败:', err)
      throw err
    }
  })

  /** 创建会话 */
  ipcMain.handle(IpcChannel.DB_CREATE_SESSION, (_event, session) => {
    log.info('[IPC] 调用 DB_CREATE_SESSION, 参数:', session)
    try {
      sessionOps.create(session)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] create-session 失败:', err)
      throw err
    }
  })

  /** 更新会话 */
  ipcMain.handle(IpcChannel.DB_UPDATE_SESSION, (_event, id: string, updates) => {
    log.info('[IPC] 调用 DB_UPDATE_SESSION, id:', id)
    try {
      sessionOps.update(id, updates)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] update-session 失败:', err)
      throw err
    }
  })

  /** 删除会话（级联删消息） */
  ipcMain.handle(IpcChannel.DB_DELETE_SESSION, (_event, id: string) => {
    log.info('[IPC] 调用 DB_DELETE_SESSION, id:', id)
    try {
      sessionOps.delete(id)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] delete-session 失败:', err)
      throw err
    }
  })

  // ==================== 消息操作（SQLite） ====================

  /** 获取会话消息 */
  ipcMain.handle(IpcChannel.DB_GET_MESSAGES, (_event, sessionId: string) => {
    log.info('[IPC] 调用 DB_GET_MESSAGES, sessionId:', sessionId)
    try {
      return messageOps.getBySession(sessionId)
    } catch (err) {
      log.error('[DB IPC] get-messages 失败:', err)
      throw err
    }
  })

  /** 添加消息 */
  ipcMain.handle(
    IpcChannel.DB_ADD_MESSAGE,
    (_event, sessionId: string, role: string, content: string, createdAt: number) => {
      log.info('[IPC] 调用 DB_ADD_MESSAGE, sessionId:', sessionId, 'role:', role)
      try {
        const id = messageOps.add(sessionId, role, content, createdAt)
        return { success: true, id }
      } catch (err) {
        log.error('[DB IPC] add-message 失败:', err)
        throw err
      }
    }
  )

  /** 更新最后一条消息内容（流式输出追加） */
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

  /** 清空会话消息 */
  ipcMain.handle(IpcChannel.DB_CLEAR_MESSAGES, (_event, sessionId: string) => {
    log.info('[IPC] 调用 DB_CLEAR_MESSAGES, sessionId:', sessionId)
    try {
      messageOps.deleteBySession(sessionId)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] clear-messages 失败:', err)
      throw err
    }
  })

  // ==================== 市场数据操作（SQLite） ====================

  /** 获取所有市场数据 */
  ipcMain.handle(IpcChannel.DB_GET_MARKET_DATA, () => {
    log.info('[IPC] 调用 DB_GET_MARKET_DATA')
    try {
      return marketDataOps.getAll()
    } catch (err) {
      log.error('[DB IPC] get-market-data 失败:', err)
      throw err
    }
  })

  /** 手动同步今日市场数据 */
  ipcMain.handle(IpcChannel.DB_SYNC_MARKET_DATA, async () => {
    log.info('[IPC] 调用 DB_SYNC_MARKET_DATA')
    try {
      const xuanguBao = XuanguBaoService.getInstance()
      const today = new Date().toISOString().split('T')[0]
      const data = await xuanguBao.getMarketIndicator(today)

      if (data) {
        marketDataOps.save(today, data.rise_count, data.fall_count)
        return { success: true }
      }
      return { success: false, message: '未能从选股通获取数据' }
    } catch (err) {
      log.error('[DB IPC] sync-market-data 失败:', err)
      throw err
    }
  })

  // ==================== 配置操作（electron-store） ====================

  /** 获取单个配置 */
  ipcMain.handle(IpcChannel.CONFIG_GET, (_event, key: string) => {
    log.info('[IPC] 调用 CONFIG_GET, key:', key)
    try {
      return appConfigOps.get(key as never)
    } catch (err) {
      log.error('[Config IPC] get 失败:', err)
      throw err
    }
  })

  /** 设置配置 */
  ipcMain.handle(IpcChannel.CONFIG_SET, (_event, key: string, value: unknown) => {
    log.info('[IPC] 调用 CONFIG_SET, key:', key)
    try {
      appConfigOps.set(key as never, value as never)
      return { success: true }
    } catch (err) {
      log.error('[Config IPC] set 失败:', err)
      throw err
    }
  })

  /** 获取所有配置 */
  ipcMain.handle(IpcChannel.CONFIG_GET_ALL, () => {
    log.info('[IPC] 调用 CONFIG_GET_ALL')
    try {
      return appConfigOps.getAll()
    } catch (err) {
      log.error('[Config IPC] get-all 失败:', err)
      throw err
    }
  })

  /** 重置配置 */
  ipcMain.handle(IpcChannel.CONFIG_RESET, () => {
    log.info('[IPC] 调用 CONFIG_RESET')
    try {
      appConfigOps.reset()
      return { success: true }
    } catch (err) {
      log.error('[Config IPC] reset 失败:', err)
      throw err
    }
  })

  log.info('[DB IPC] 数据库 IPC 处理器注册完成')
}
