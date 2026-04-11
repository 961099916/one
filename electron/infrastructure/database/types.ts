/**
 * 数据库实体类型定义
 */

export interface SessionRow {
  id: string
  title: string
  created_at: number
  updated_at: number
}

export interface MessageRow {
  id: number
  session_id: string
  role: string
  content: string
  created_at: number
}

export interface MarketDataRow {
  id: number
  date: string
  timestamp: number
  rise_count: number
  fall_count: number
  created_at: number
}

export interface TradingDayRow {
  date: string
  is_trading: number // 1: 交易日, 0: 休市
  updated_at: number
}
