/**
 * 股票池数据仓储
 * 负责个股分池数据（涨停池等）的持久化操作
 */
import log from 'electron-log'
import { getDB } from '../connection'
import type { StockPoolRow } from '../types'

/**
 * 股票池数据仓储操作
 */
export const stockPoolRepository = {
  /**
   * 获取指定日期和池子的股票数据
   */
  getByPoolAndDate(poolName: string, date: string): StockPoolRow[] {
    const db = getDB()
    const stmt = db.prepare(`
      SELECT * FROM stock_pool_data 
      WHERE pool_name = ? AND date = ? 
      ORDER BY board_count DESC, last_limit_up_time ASC
    `)
    return stmt.all(poolName, date) as StockPoolRow[]
  },

  /**
   * 批量保存股票池数据 (Upsert)
   */
  saveBatch(records: StockPoolRow[]): void {
    if (records.length === 0) return

    const db = getDB()
    const now = Date.now()

    const upsert = db.prepare(`
      INSERT INTO stock_pool_data (
        pool_name, date, symbol, stock_name, 
        reason_info, latest_price, change_percent, 
        buy_lock_ratio, turnover_ratio, 
        non_restricted_cap, total_cap, 
        first_limit_up_time, last_limit_up_time, 
        break_count, board_count, 
        raw_data, created_at
      )
      VALUES (
        @pool_name, @date, @symbol, @stock_name, 
        @reason_info, @latest_price, @change_percent, 
        @buy_lock_ratio, @turnover_ratio, 
        @non_restricted_cap, @total_cap, 
        @first_limit_up_time, @last_limit_up_time, 
        @break_count, @board_count, 
        @raw_data, @created_at
      )
      ON CONFLICT(pool_name, date, symbol) DO UPDATE SET
        stock_name = excluded.stock_name,
        reason_info = excluded.reason_info,
        latest_price = excluded.latest_price,
        change_percent = excluded.change_percent,
        buy_lock_ratio = excluded.buy_lock_ratio,
        turnover_ratio = excluded.turnover_ratio,
        non_restricted_cap = excluded.non_restricted_cap,
        total_cap = excluded.total_cap,
        first_limit_up_time = excluded.first_limit_up_time,
        last_limit_up_time = excluded.last_limit_up_time,
        break_count = excluded.break_count,
        board_count = excluded.board_count,
        raw_data = excluded.raw_data,
        created_at = @created_at
    `)

    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        upsert.run({ ...row, created_at: now })
      }
    })

    transaction(records)
    log.info(`[StockPoolRepository] 已完成批量同步: ${records[0].pool_name}, 日期: ${records[0].date}, 记录数: ${records.length}`)
  },

  /**
   * 删除指定日期和池子的数据
   */
  deleteByPoolAndDate(poolName: string, date: string): void {
    const db = getDB()
    const stmt = db.prepare('DELETE FROM stock_pool_data WHERE pool_name = ? AND date = ?')
    stmt.run(poolName, date)
    log.info(`[StockPoolRepository] 记录已删除: ${poolName}, 日期: ${date}`)
  },

  /**
   * 获取多个日期的池子数据 (用于情绪周期表)
   */
  getLatestPoolRecordsByDates(poolName: string, dates: string[]): StockPoolRow[] {
    if (dates.length === 0) return []
    const db = getDB()
    // SQLite 不支持直接绑定数组，需要构建占位符
    const placeholders = dates.map(() => '?').join(',')
    const stmt = db.prepare(`
      SELECT * FROM stock_pool_data 
      WHERE pool_name = ? AND date IN (${placeholders})
      ORDER BY date DESC, board_count DESC, last_limit_up_time ASC
    `)
    return stmt.all(poolName, ...dates) as StockPoolRow[]
  },

  /**
   * 获取指定日期范围内，最高连板高度 >= minBoard 的所有个股及其核心信息
   */
  getHighBoardStocksByDateRange(dates: string[], minBoard: number): Array<{ symbol: string, stock_name: string, reason_info: string, max_board: number }> {
    if (dates.length === 0) return []
    const db = getDB()
    const placeholders = dates.map(() => '?').join(',')
    const stmt = db.prepare(`
      SELECT 
        symbol, 
        stock_name, 
        reason_info,
        MAX(board_count) as max_board
      FROM stock_pool_data 
      WHERE date IN (${placeholders}) AND pool_name = 'limit_up'
      GROUP BY symbol
      HAVING max_board >= ?
      ORDER BY max_board DESC, last_limit_up_time ASC
    `)
    return stmt.all(...dates, minBoard) as any[]
  }
}
