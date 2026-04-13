/**
 * 市场数据与分析相关类型定义
 */

/** 市场大盘指标行实体 */
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

/** 交易日行实体 */
export interface TradingDayRow {
  date: string
  is_trading: number // 1: 交易日, 0: 休市
  updated_at: number
}

/** 股票池行实体 */
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

/** 题材板块行实体 */
export interface SurgePlateRow {
  id?: number
  date: string
  timestamp: number
  plate_id: number
  name: string
  description?: string
  created_at: number
}

/** 异动个股行实体 */
export interface SurgeStockRow {
  id?: number
  date: string
  timestamp: number
  symbol: string
  stock_name: string
  price?: number
  change_percent?: number
  description?: string
  plate_ids?: string // JSON string
  is_limit_up: number
  enter_time?: number
  raw_data?: string
  created_at: number
}

/** 涨停板原始数据 (从 SurgeStockRow.raw_data 解析) */
export interface SurgeStockRawData {
  limit_up_days?: number
  turnover_ratio?: number
  total_capital?: number
  surge_reason?: {
    stock_reason?: string
  }
  [key: string]: any
}

/** 经过类型强化的股票数据 */
export interface SurgeStock extends SurgeStockRow {
  /** 预解析的原始数据 */
  parsedRawData: SurgeStockRawData
}

/** 板块详情（包含关联股票） */
export interface PlateDetail extends SurgePlateRow {
  /** 关联的股票总数 */
  stockCount: number
  /** 涨停股票总数 */
  limitUpCount: number
  /** 关联的股票列表 */
  stocks: SurgeStock[]
  /** 经过过滤后的股票列表 (View 层动态计算) */
  filteredStocks?: SurgeStock[]
}

/** 每日全景复盘数据 */
export interface TimelineDay {
  date: string
  plates: PlateDetail[]
}

/** 情绪周期摘要数据 */
export interface SentimentDay {
  date: string
  // 市场指标
  limitUpCount: number
  limitDownCount: number
  brokenCount: number
  brokenRatio: number
  temperature: number
  riseCount: number
  fallCount: number
  riseRatio: number
  // 通达信增强指标
  turnover?: number
  indexChange?: number
  // 深度指标
  bigMeat?: number
  bigFace?: number
  profitAvg?: number
  // 连板梯队
  matrix: Record<number, any[]> // board_count -> stocks[]
  ladder: Record<number, number> // board_count -> count
  maxBoard: number
  secondMaxBoard: number
  dragonStock: string
  // 跌停板
  minDownBoard: number
  secondMinDownBoard: number
  // 晋级率
  promotionRates: Record<number, number> // N -> N+1 晋级率
  // 核心题材
  topSectors: Array<{ name: string, count: number }>
}
