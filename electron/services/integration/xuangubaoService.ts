/**
 * 选股通 API 服务
 */
import log from 'electron-log'
import { XuanguBaoConfig, HttpHeaders, HttpMethods, LogTags } from '../../constants'

export interface MarketIndicatorData {
  rise_count: number
  fall_count: number
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
   * 获取市场涨跌数据
   * @param date 日期，格式：YYYY-MM-DD
   */
  async getMarketIndicator(date: string): Promise<MarketIndicatorData | null> {
    try {
      log.info(`${LogTags.XUANGUBAO} 获取市场数据，日期:`, date)

      const url = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.MARKET_INDICATOR}?fields=${XuanguBaoConfig.FIELDS.RISE_FALL_COUNT}&date=${date}`
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

      const result = (await response.json()) as XuanguBaoResponse<MarketIndicatorData>
      log.info(`${LogTags.XUANGUBAO} 市场数据获取成功:`, result.data)

      return result.data
    } catch (err) {
      log.error(`${LogTags.XUANGUBAO} 获取市场数据失败:`, err)
      return null
    }
  }

  /**
   * 获取今日市场涨跌数据
   */
  async getTodayMarketIndicator(): Promise<MarketIndicatorData | null> {
    const today = new Date().toISOString().split('T')[0]
    return this.getMarketIndicator(today)
  }
}
