/**
 * 数据库迁移与表结构管理
 * 基于 PRAGMA user_version 实现轻量级迁移引擎
 */
import log from 'electron-log'
import type { Database } from 'better-sqlite3'
import { getDB } from './connection'

// 当前数据库期望的最新版本
const LATEST_SCHEMA_VERSION = 2

/**
 * 初始化数据库架构并执行迁移
 */
export function initDatabaseSchema(): void {
  const db = getDB()
  
  // 获取当前数据库的版本号
  const currentVersion = db.pragma('user_version', { simple: true }) as number
  
  log.info(`[Database] 当前数据库版本: ${currentVersion}, 期望版本: ${LATEST_SCHEMA_VERSION}`)

  if (currentVersion < LATEST_SCHEMA_VERSION) {
    try {
      // 使用事务包裹迁移过程，确保原子性
      db.transaction(() => {
        if (currentVersion < 1) {
          log.info('[Database] 正在执行迁移 V1: 初始化基础聊天表...')
          migrateToV1(db)
        }
        
        if (currentVersion < 2) {
          log.info('[Database] 正在执行迁移 V2: 初始化选股通数据表...')
          migrateToV2(db)
        }
        
        // 更新版本号
        db.pragma(`user_version = ${LATEST_SCHEMA_VERSION}`)
      })()
      
      log.info(`[Database] 数据库成功升级至版本 ${LATEST_SCHEMA_VERSION}`)
    } catch (err) {
      log.error('[Database] 数据库迁移失败:', err)
      throw err
    }
  } else {
    log.debug('[Database] 数据库版本已是最新，无需迁移')
  }
}

/**
 * 迁移 V1: 基础聊天模块
 */
function migrateToV1(db: Database): void {
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

  // 索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC)`)
}

/**
 * 迁移 V2: 选股通管理模块
 */
function migrateToV2(db: Database): void {
  // 市场数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL UNIQUE,
      rise_count INTEGER DEFAULT 0,
      fall_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `)

  // 交易日历表
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_days (
      date TEXT PRIMARY KEY,
      is_trading INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data(date)`)
}
