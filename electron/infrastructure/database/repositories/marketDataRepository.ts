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
   * 获取所有市场数据（按日期倒序）
   */
  getAll(): MarketDataRow[] {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM market_data ORDER BY date DESC')
    return stmt.all() as MarketDataRow[]
  },

  /**
   * 根据日期获取市场数据
   */
  getByDate(date: string): MarketDataRow | undefined {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM market_data WHERE date = ?')
    const result = stmt.get(date)
    return result as MarketDataRow | undefined
  },

  /**
   * 保存市场数据（如果存在则更新）
   */
  save(date: string, riseCount: number, fallCount: number): void {
    const db = getDB()
    const now = Date.now()

    const existing = this.getByDate(date)
    if (existing) {
      const stmt = db.prepare(`
        UPDATE market_data
        SET rise_count = ?, fall_count = ?, created_at = ?
        WHERE date = ?
      `)
      stmt.run(riseCount, fallCount, now, date)
      log.debug('[MarketDataRepository] 市场数据更新成功:', date)
    } else {
      const stmt = db.prepare(`
        INSERT INTO market_data (date, rise_count, fall_count, created_at)
        VALUES (?, ?, ?, ?)
      `)
      stmt.run(date, riseCount, fallCount, now)
      log.debug('[MarketDataRepository] 市场数据创建成功:', date)
    }
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
