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
  limit_up_count: number
  limit_down_count: number
  limit_up_broken_count: number
  limit_up_broken_ratio: number
  market_temperature: number
  created_at: number
}

export interface TradingDayRow {
  date: string
  is_trading: number // 1: 交易日, 0: 休市
  updated_at: number
}

export interface StockPoolRow {
  id?: number
  pool_name: string
  date: string
  symbol: string
  stock_name?: string
  reason_info?: string
  latest_price?: number
  change_percent?: number
  buy_lock_ratio?: number
  turnover_ratio?: number
  non_restricted_cap?: number
  total_cap?: number
  first_limit_up_time?: number
  last_limit_up_time?: number
  break_count?: number
  board_count?: number
  raw_data?: string
  created_at: number
}
