/**
 * 交易日仓储
 * 负责管理每日是否开盘的数据缓存
 */
import log from 'electron-log'
import { getDB } from '../connection'
import type { TradingDayRow } from '@common/types'

export const tradingDayRepository = {
  /**
   * 获取指定日期的交易状态
   * @returns 1: 交易日, 0: 休市, undefined: 未知
   */
  getStatus(date: string): number | undefined {
    const db = getDB()
    const stmt = db.prepare('SELECT is_trading FROM trading_days WHERE date = ?')
    const row = stmt.get(date) as { is_trading: number } | undefined
    return row?.is_trading
  },

  /**
   * 保存交易日状态
   */
  saveStatus(date: string, isTrading: boolean): void {
    const db = getDB()
    const isTradingVal = isTrading ? 1 : 0
    const now = Date.now()

    const stmt = db.prepare(`
      INSERT INTO trading_days (date, is_trading, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        is_trading = excluded.is_trading,
        updated_at = excluded.updated_at
    `)
    stmt.run(date, isTradingVal, now)
    log.debug(`[TradingDayRepository] 已保存日期状态: ${date} -> ${isTrading ? '交易日' : '休市'}`)
  },

  /**
   * 判定是否为休市（明确标记为 0）
   */
  isNonTrading(date: string): boolean {
    return this.getStatus(date) === 0
  },

  /**
   * 获取所有已存储的交易日记录
   */
  getAll(): TradingDayRow[] {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM trading_days ORDER BY date ASC')
    return stmt.all() as TradingDayRow[]
  },

  /**
   * 获取最近 N 个交易日 (用于情绪周期表)
   */
  getLatestTradingDays(limit: number): TradingDayRow[] {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT * FROM trading_days 
      WHERE is_trading = 1 
      ORDER BY date DESC 
      LIMIT ?
    `)
    return stmt.all(limit) as TradingDayRow[]
  },

  /**
   * 获取最近一个交易日
   */
  getLatestTradingDay(): TradingDayRow | undefined {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT * FROM trading_days 
      WHERE is_trading = 1 
      ORDER BY date DESC 
      LIMIT 1
    `)
    return stmt.get() as TradingDayRow | undefined
  }
}
