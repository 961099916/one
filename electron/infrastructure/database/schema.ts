/**
 * 数据库表结构定义
 * 负责创建表和索引
 */
import log from 'electron-log'
import { getDB } from './connection'

/**
 * 创建所有数据表
 */
export function createTables(): void {
  const db = getDB()

  // 会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `)

  // 市场数据表（涨停/跌停数据）
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      rise_count INTEGER DEFAULT 0,
      fall_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)

  log.debug('[Database] 数据表创建完成')
}

/**
 * 创建所有索引
 */
export function createIndexes(): void {
  const db = getDB()

  // 会话更新时间索引（用于排序）
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC)
  `)

  // 消息会话索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)
  `)

  // 消息创建时间索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC)
  `)

  log.debug('[Database] 索引创建完成')
}
