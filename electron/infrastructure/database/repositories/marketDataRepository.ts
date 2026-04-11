/**
 * 市场数据仓储
 * 负责市场数据的持久化操作
 */
import log from 'electron-log'
import { getDB } from '../connection'
import type { MarketDataRow } from '../types'

/**
 * 市场数据仓储操作
 */
export const marketDataRepository = {
  /**
   * 根据日期范围获取市场数据（按时间戳升序，用于折线图）
   */
  getByDateRange(startDate: string, endDate: string): MarketDataRow[] {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT * FROM market_data 
      WHERE date >= ? AND date <= ? 
      ORDER BY timestamp ASC
    `)
    return stmt.all(startDate, endDate) as MarketDataRow[]
  },

  /**
   * 获取所有市场分时数据（按时间戳升序）
   */
  getAll(): MarketDataRow[] {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM market_data ORDER BY timestamp ASC')
    return stmt.all() as MarketDataRow[]
  },

  /**
   * 批量保存全量分时数据
   */
  saveBatch(date: string, points: { timestamp: number, rise_count: number, fall_count: number }[]): void {
    const db = getDB()
    const now = Date.now()

    const insert = db.prepare(`
      INSERT OR IGNORE INTO market_data (date, timestamp, rise_count, fall_count, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction((records) => {
      for (const record of records) {
        insert.run(date, record.timestamp, record.rise_count, record.fall_count, now)
      }
    })

    transaction(points)
    log.debug(`[MarketDataRepository] 已完成批量同步: ${date}, 记录数: ${points.length}`)
  },

  /**
   * 删除指定日期的市场数据
   */
  deleteByDate(date: string): void {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM market_data WHERE date = ?')
    stmt.run(date)
    log.debug('[MarketDataRepository] 市场数据删除成功:', date)
  },
}
