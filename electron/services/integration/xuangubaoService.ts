/**
 * 选股通 API 服务
 */
import log from 'electron-log'
import { XuanguBaoConfig, HttpHeaders, HttpMethods, LogTags } from '../../constants'
import { stockPoolRepository } from '../../infrastructure/database/repositories/stockPoolRepository'
import type { StockPoolRow } from '../../infrastructure/database/types'

export interface MarketIndicatorData {
  rise_count: number
  fall_count: number
  limit_up_count?: number
  limit_down_count?: number
  limit_up_broken_count?: number
  limit_up_broken_ratio?: number
  market_temperature?: number
  timestamp: number
}

export interface StockPoolInfo {
  symbol: string
  stock_chi_name: string
  price: number
  change_percent: number
  buy_lock_volume_ratio: number
  turnover_ratio: number
  non_restricted_capital: number
  total_capital: number
  first_limit_up: number
  last_limit_up: number
  break_limit_up_times: number
  limit_up_days: number
  surge_reason?: {
    stock_reason: string
    related_plates: Array<{ plate_name: string }>
  }
  [key: string]: any
}

export interface XuanguBaoResponse<T> {
  data: T
  [key: string]: unknown
}

export class XuanguBaoService {
  private static instance: XuanguBaoService

  static getInstance(): XuanguBaoService {
    if (!XuanguBaoService.instance) {
      XuanguBaoService.instance = new XuanguBaoService()
    }
    return XuanguBaoService.instance
  }

  /**
   * 获取市场分时涨跌数据
   * @param date 日期，格式：YYYY-MM-DD
   */
  async getMarketIndicator(date: string): Promise<MarketIndicatorData[]> {
    try {
      log.info(`${LogTags.XUANGUBAO} 获取分时数据，日期:`, date)

      const fields = [
        XuanguBaoConfig.FIELDS.RISE_FALL_COUNT,
        XuanguBaoConfig.FIELDS.LIMIT_UP_DOWN_COUNT,
        XuanguBaoConfig.FIELDS.LIMIT_UP_BROKEN,
        XuanguBaoConfig.FIELDS.MARKET_TEMPERATURE
      ].join(',')
      const url = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.MARKET_INDICATOR}?fields=${fields}&date=${date}`
      const response = await fetch(url, {
        method: HttpMethods.GET,
        headers: {
          Accept: HttpHeaders.ACCEPT_JSON,
          'User-Agent': HttpHeaders.USER_AGENT,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = (await response.json()) as XuanguBaoResponse<MarketIndicatorData[]>
      
      if (!result.data || !Array.isArray(result.data)) {
        log.warn(`${LogTags.XUANGUBAO} 接口未返回有效的 data 数组`)
        return []
      }

      log.info(`${LogTags.XUANGUBAO} 分时数据获取成功，记录数:`, result.data.length)
      return result.data
    } catch (err) {
      log.error(`${LogTags.XUANGUBAO} 获取分时数据失败:`, err)
      return []
    }
  }

  /**
   * 获取今日市场涨跌数据
   */
  async getTodayMarketIndicator(): Promise<MarketIndicatorData | null> {
    const today = new Date().toISOString().split('T')[0]
    const data = await this.getMarketIndicator(today)
    return data && data.length > 0 ? data[data.length - 1] : null
  }

  /**
   * 同步指定日期的股票池数据
   * @param poolName 池子名称 (如 limit_up)
   * @param date 日期 YYYY-MM-DD
   */
  async syncStockPool(poolName: string, date: string): Promise<boolean> {
    try {
      log.info(`${LogTags.XUANGUBAO} 同步股票池: ${poolName}, 日期: ${date}`)

      const url = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.STOCK_POOL}?pool_name=${poolName}&date=${date}`
      const response = await fetch(url, {
        method: HttpMethods.GET,
        headers: {
          Accept: HttpHeaders.ACCEPT_JSON,
          'User-Agent': HttpHeaders.USER_AGENT,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = (await response.json()) as XuanguBaoResponse<StockPoolInfo[]>

      if (!result.data || !Array.isArray(result.data)) {
        log.warn(`${LogTags.XUANGUBAO} 接口未返回有效的股票池数据`)
        return false
      }

      const rows: StockPoolRow[] = result.data.map((item) => {
        let reasonText = ''
        if (item.surge_reason) {
          const plates = item.surge_reason.related_plates || []
          const platesStr = plates.length > 0 ? ` [${plates.map((p: any) => p.plate_name).join(', ')}]` : ''
          reasonText = `${item.surge_reason.stock_reason || ''}${platesStr}`
        }
        
        return {
          pool_name: poolName,
          date: date,
          symbol: item.symbol,
          stock_name: item.stock_chi_name,
          reason_info: reasonText,
          latest_price: item.price,
          change_percent: item.change_percent,
          buy_lock_ratio: item.buy_lock_volume_ratio,
          turnover_ratio: item.turnover_ratio,
          non_restricted_cap: item.non_restricted_capital,
          total_cap: item.total_capital,
          first_limit_up_time: item.first_limit_up || item.first_limit_down || 0,
          last_limit_up_time: item.last_limit_up || item.last_limit_down || 0,
          break_count: item.break_limit_up_times || item.break_limit_down_times || 0,
          board_count: item.limit_up_days || item.limit_down_days || item.m_days_n_boards_boards || 0,
          raw_data: JSON.stringify(item),
          created_at: Date.now()
        }
      })

      stockPoolRepository.saveBatch(rows)
      return true
    } catch (err) {
      log.error(`${LogTags.XUANGUBAO} 同步股票池数据失败:`, err)
      return false
    }
  }
}
