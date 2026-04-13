/**
 * 会话仓储
 * 负责会话数据的持久化操作
 */
import log from 'electron-log'
import { getDB } from '../connection'
import type { SessionRow } from '@common/types'

/**
 * 会话仓储操作
 */
export const sessionRepository = {
  /**
   * 获取所有会话（按更新时间倒序）
   */
  getAll(): SessionRow[] {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC')
    return stmt.all() as SessionRow[]
  },

  /**
   * 创建会话
   */
  create(session: SessionRow): void {
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO sessions (id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(session.id, session.title, session.created_at, session.updated_at)
    log.debug('[SessionRepository] 会话创建成功:', session.id)
  },

  /**
   * 更新会话（标题、更新时间）
   */
  update(id: string, updates: Partial<Omit<SessionRow, 'id' | 'created_at'>>): void {
    const db = getDB()

    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.updated_at !== undefined) {
      fields.push('updated_at = ?')
      values.push(updates.updated_at)
    }

    if (fields.length === 0) return

    values.push(id)
    const stmt = db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)
    log.debug('[SessionRepository] 会话更新成功:', id)
  },

  /**
   * 删除会话（级联删除消息）
   */
  delete(id: string): void {
    const db = getDB()
    // 使用外键级联删除，只需删除会话
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?')
    stmt.run(id)
    log.debug('[SessionRepository] 会话删除成功:', id)
  },

  /**
   * 获取单个会话
   */
  getById(id: string): SessionRow | undefined {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?')
    const result = stmt.get(id)
    return result as SessionRow | undefined
  },
}
