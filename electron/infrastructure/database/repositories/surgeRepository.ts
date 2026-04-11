/**
 * 热点题材（追涨）数据仓储
 * 负责每日热点板块及关联个股的持久化操作
 */
import log from 'electron-log'
import { getDB } from '../connection'
import type { SurgePlateRow, SurgeStockRow } from '../types'

/**
 * 热点题材数据仓储操作
 */
export const surgeRepository = {
  getPlatesByDate(params: { date: string, timestamp?: number }): SurgePlateRow[] {
    const { date, timestamp } = params
    const db = getDB()
    
    let targetTs = timestamp
    if (!targetTs) {
      // 获取该日期下最新的一个时间戳
      const latestTsRow = db.prepare('SELECT MAX(timestamp) as ts FROM surge_plates WHERE date = ?').get(date) as { ts: number } | undefined
      if (!latestTsRow || !latestTsRow.ts) return []
      targetTs = latestTsRow.ts
    }

    const stmt = db.prepare('SELECT * FROM surge_plates WHERE timestamp = ? ORDER BY id ASC')
    return stmt.all(targetTs) as SurgePlateRow[]
  },

  /**
   * 获取指定日期下最新的时间戳
   */
  getLatestTimestampByDate(date: string): number | null {
    const db = getDB()
    const row = db.prepare('SELECT MAX(timestamp) as ts FROM surge_plates WHERE date = ?').get(date) as { ts: number } | undefined
    return row?.ts || null
  },

  getStocksByDate(params: { date: string, timestamp?: number }): SurgeStockRow[] {
    const { date, timestamp } = params
    const db = getDB()
    
    let targetTs = timestamp
    if (!targetTs) {
      // 获取该日期下最新的一个时间戳
      const latestTsRow = db.prepare('SELECT MAX(timestamp) as ts FROM surge_stocks WHERE date = ?').get(date) as { ts: number } | undefined
      if (!latestTsRow || !latestTsRow.ts) return []
      targetTs = latestTsRow.ts
    }

    const stmt = db.prepare('SELECT * FROM surge_stocks WHERE timestamp = ? ORDER BY change_percent DESC')
    return stmt.all(targetTs) as SurgeStockRow[]
  },

  /**
   * 获取某天内所有可用的时间戳快照点
   */
  getTimestampsByDate(date: string): number[] {
    const db = getDB()
    const stmt = db.prepare('SELECT DISTINCT timestamp FROM surge_plates WHERE date = ? ORDER BY timestamp DESC')
    const rows = stmt.all(date) as { timestamp: number }[]
    return rows.map(r => r.timestamp)
  },

  /**
   * 获取数据库中存在热点数据的所有日期列表
   */
  getHistoricalDates(): string[] {
    const db = getDB()
    const stmt = db.prepare('SELECT DISTINCT date FROM surge_plates ORDER BY date DESC')
    const rows = stmt.all() as { date: string }[]
    return rows.map(r => r.date)
  },

  /**
   * 获取特定时间戳下的所有个股
   */
  getStocksByTimestamp(timestamp: number): SurgeStockRow[] {
    const db = getDB()
    const stmt = db.prepare('SELECT * FROM surge_stocks WHERE timestamp = ? ORDER BY change_percent DESC')
    return stmt.all(timestamp) as SurgeStockRow[]
  },

  /**
   * 批量保存热点板块 (Upsert)
   */
  savePlatesBatch(records: SurgePlateRow[]): void {
    if (records.length === 0) return

    const db = getDB()
    const now = Date.now()

    const upsert = db.prepare(`
      INSERT INTO surge_plates (
        date, timestamp, plate_id, name, description, created_at
      )
      VALUES (
        @date, @timestamp, @plate_id, @name, @description, @created_at
      )
      ON CONFLICT(timestamp, plate_id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        created_at = @created_at
    `)

    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        upsert.run({ ...row, created_at: now })
      }
    })

    transaction(records)
    log.info(`[SurgeRepository] 已完成板块批量同步, 日期: ${records[0].date}, 记录数: ${records.length}`)
  },

  /**
   * 批量保存热点个股 (Upsert)
   */
  saveStocksBatch(records: SurgeStockRow[]): void {
    if (records.length === 0) return

    const db = getDB()
    const now = Date.now()

    const upsert = db.prepare(`
      INSERT INTO surge_stocks (
        date, timestamp, symbol, stock_name, price, 
        change_percent, description, plate_ids, 
        is_limit_up, enter_time, raw_data, created_at
      )
      VALUES (
        @date, @timestamp, @symbol, @stock_name, @price, 
        @change_percent, @description, @plate_ids, 
        @is_limit_up, @enter_time, @raw_data, @created_at
      )
      ON CONFLICT(timestamp, symbol) DO UPDATE SET
        stock_name = excluded.stock_name,
        price = excluded.price,
        change_percent = excluded.change_percent,
        description = excluded.description,
        plate_ids = excluded.plate_ids,
        is_limit_up = excluded.is_limit_up,
        enter_time = excluded.enter_time,
        raw_data = excluded.raw_data,
        created_at = @created_at
    `)

    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        upsert.run({ ...row, created_at: now })
      }
    })

    transaction(records)
    log.info(`[SurgeRepository] 已完成个股批量同步, 日期: ${records[0].date}, 记录数: ${records.length}`)
  },

  /**
   * 删除指定日期的数据
   */
  deleteByDate(date: string): void {
    const db = getDB()
    db.transaction(() => {
      db.prepare('DELETE FROM surge_plates WHERE date = ?').run(date)
      db.prepare('DELETE FROM surge_stocks WHERE date = ?').run(date)
    })()
    log.info(`[SurgeRepository] 记录已删除, 日期: ${date}`)
  }
}
