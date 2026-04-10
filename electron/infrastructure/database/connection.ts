/**
 * 数据库连接管理
 * 负责数据库的初始化、连接获取和关闭
 */
import Database from 'better-sqlite3'
import { app } from 'electron'
import * as path from 'path'
import log from 'electron-log'

let db: Database.Database | null = null

/**
 * 获取数据库文件路径
 */
function getDbPath(): string {
  return path.join(app.getPath('userData'), 'database.sqlite')
}

/**
 * 获取数据库实例
 */
export function getDBInstance(): Database.Database | null {
  return db
}

/**
 * 获取数据库实例（内部使用，抛出异常如果未初始化）
 */
export function getDB(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

/**
 * 初始化数据库连接
 */
export function initConnection(): void {
  try {
    const dbPath = getDbPath()
    log.info('[Database] 初始化数据库:', dbPath)

    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')

    log.info('[Database] 数据库连接初始化成功')
  } catch (err) {
    log.error('[Database] 数据库连接初始化失败:', err)
    throw err
  }
}

/**
 * 关闭数据库连接
 */
export function closeConnection(): void {
  if (db) {
    try {
      db.close()
      db = null
      log.info('[Database] 数据库连接已关闭')
    } catch (err) {
      log.error('[Database] 关闭数据库连接失败:', err)
    }
  }
}
