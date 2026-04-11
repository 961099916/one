/**
 * SQLite 数据库模块（主进程）
 *
 * 使用 better-sqlite3 存储核心业务数据：会话、消息等
 * 数据库文件存储在 userData/database.sqlite
 *
 * 架构说明：
 * - connection.ts: 数据库连接管理
 * - schema.ts: 表结构和索引定义
 * - types.ts: 实体类型定义
 * - repositories/: 各实体的仓储实现
 */
import log from 'electron-log'
import { initConnection, closeConnection } from './connection'
import { initDatabaseSchema } from './schema'
import { sessionRepository, messageRepository, marketDataRepository, tradingDayRepository, stockPoolRepository, surgeRepository } from './repositories'

// 导出类型
export type { SessionRow, MessageRow, MarketDataRow, StockPoolRow, SurgePlateRow, SurgeStockRow } from './types'

// 导出连接管理
export { getDBInstance } from './connection'

// 导出仓储
export const sessionOps = sessionRepository
export const messageOps = messageRepository
export const marketDataOps = marketDataRepository
export const tradingDayOps = tradingDayRepository
export const stockPoolOps = stockPoolRepository
export const surgeOps = surgeRepository

/**
 * 初始化数据库
 * 创建数据库表和索引
 */
export function initDB(): void {
  try {
    initConnection()
    initDatabaseSchema()
    log.info('[SQLite] 数据库初始化成功')
  } catch (err) {
    log.error('[SQLite] 数据库初始化失败:', err)
    throw err
  }
}

/**
 * 关闭数据库连接
 */
export function closeDB(): void {
  closeConnection()
}
