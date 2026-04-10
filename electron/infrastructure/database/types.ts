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
  rise_count: number
  fall_count: number
  created_at: number
}

}
