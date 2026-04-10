/**
 * 消息仓储
 * 负责消息数据的持久化操作
 */
import log from 'electron-log'
import { getDB } from '../connection'
import type { MessageRow } from '../types'

/**
 * 消息仓储操作
 */
export const messageRepository = {
  /**
   * 获取会话所有消息（按创建时间升序）
   */
  getBySession(sessionId: string): MessageRow[] {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `)
    return stmt.all(sessionId) as MessageRow[]
  },

  /**
   * 添加消息
   */
  add(sessionId: string, role: string, content: string, createdAt: number): number {
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO messages (session_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(sessionId, role, content, createdAt)
    log.debug('[MessageRepository] 消息添加成功, sessionId:', sessionId)
    return Number(result.lastInsertRowid)
  },

  /**
   * 更新最后一条消息内容（用于流式追加）
   */
  updateLastContent(sessionId: string, content: string): void {
    const db = getDB()
    const stmt = db.prepare(`
      UPDATE messages
      SET content = ?
      WHERE id = (
        SELECT id FROM messages
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      )
    `)
    stmt.run(content, sessionId)
    log.debug('[MessageRepository] 最后一条消息更新成功, sessionId:', sessionId)
  },

  /**
   * 删除会话的所有消息
   */
  deleteBySession(sessionId: string): void {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM messages WHERE session_id = ?')
    stmt.run(sessionId)
    log.debug('[MessageRepository] 会话消息删除成功, sessionId:', sessionId)
  },

  /**
   * 获取会话消息数量
   */
  countBySession(sessionId: string): number {
    const db = getDB()
    const stmt = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?')
    const result = stmt.get(sessionId) as { count: number }
    return result.count
  },
}
