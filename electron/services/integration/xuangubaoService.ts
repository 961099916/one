/**
 * 选股通 API 服务
 */
import log from 'electron-log'
import { XuanguBaoConfig, HttpHeaders, HttpMethods, LogTags } from '../../constants'
import { stockPoolRepository } from '../../infrastructure/database/repositories/stockPoolRepository'
import { surgeRepository } from '../../infrastructure/database/repositories/surgeRepository'
import type { StockPoolRow, SurgePlateRow, SurgeStockRow } from '../../infrastructure/database/types'

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
  code: number
  message: string
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
   * 基础请求处理（带业务状态码校验与详细日志）
   */
  private async fetchWithValidation<T>(url: string, logMsg: string): Promise<T | null> {
    const startTime = performance.now()
    try {
      log.info(`${LogTags.XUANGUBAO} [Request] ${url}`)

      const response = await fetch(url, {
        method: HttpMethods.GET,
        headers: {
          Accept: HttpHeaders.ACCEPT_JSON,
          'User-Agent': HttpHeaders.USER_AGENT,
        },
      })

      const duration = (performance.now() - startTime).toFixed(2)

      if (!response.ok) {
        log.error(`${LogTags.XUANGUBAO} [Error] HTTP ${response.status} ${response.statusText}, 耗时: ${duration}ms, URL: ${url}`)
        return null
      }

      const result = (await response.json()) as XuanguBaoResponse<T>

      if (result.code !== 20000) {
        log.error(`${LogTags.XUANGUBAO} [Business Error] Code: ${result.code}, Message: ${result.message || '未知错误'}, 耗时: ${duration}ms, URL: ${url}`)
        return null
      }

      if (result.data === undefined || result.data === null) {
        log.warn(`${LogTags.XUANGUBAO} [Warning] 接口返回 data 为空, 耗时: ${duration}ms, URL: ${url}`)
        return null
      }

      const dataSnippet = JSON.stringify(result.data).substring(0, 300)
      log.info(`${LogTags.XUANGUBAO} [Success] ${logMsg}, 耗时: ${duration}ms, Response: ${dataSnippet}...`)
      return result.data
    } catch (err) {
      const duration = (performance.now() - startTime).toFixed(2)
      log.error(`${LogTags.XUANGUBAO} [Exception] ${err}, 耗时: ${duration}ms, URL: ${url}`)
      return null
    }
  }

  async getMarketIndicator(date: string): Promise<MarketIndicatorData[]> {
    const fields = [
      XuanguBaoConfig.FIELDS.RISE_FALL_COUNT,
      XuanguBaoConfig.FIELDS.LIMIT_UP_DOWN_COUNT,
      XuanguBaoConfig.FIELDS.LIMIT_UP_BROKEN,
      XuanguBaoConfig.FIELDS.MARKET_TEMPERATURE
    ].join(',')

    const url = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.MARKET_INDICATOR}?fields=${fields}&date=${date}`
    const data = await this.fetchWithValidation<MarketIndicatorData[]>(url, `获取分时数据, 日期: ${date}`)

    return data || []
  }

  /**
   * 获取今日市场涨跌数据
   */
  async getTodayMarketIndicator(): Promise<MarketIndicatorData | null> {
    const today = new Date().toISOString().split('T')[0]
    const data = await this.getMarketIndicator(today)
    return data && data.length > 0 ? data[data.length - 1] : null
  }

  async syncStockPool(poolName: string, date: string): Promise<boolean> {
    const url = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.STOCK_POOL}?pool_name=${poolName}&date=${date}`
    const data = await this.fetchWithValidation<StockPoolInfo[]>(url, `同步股票池: ${poolName}, 日期: ${date}`)

    if (!data || !Array.isArray(data)) return false

    const rows: StockPoolRow[] = data.map((item) => {
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
  }

  /**
   * 同步每日热点专题数据 (板块与个股)
   * @param date 日期 YYYY-MM-DD
   */
  async syncSurgeData(date: string): Promise<boolean> {
    try {
      // 1. 同步板块列表
      const defaultUnixTs = Math.floor(new Date(`${date} 15:00:00`).getTime() / 1000)
      const platesUrl = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.SURGE_PLATES}?date=${defaultUnixTs}`
      const platesData = await this.fetchWithValidation<any>(platesUrl, `同步热点板块, 日期: ${date}`)

      let plateRows: SurgePlateRow[] = []
      let apiTimestamp = defaultUnixTs

      if (platesData) {
        let rawItems: any[] = []
        if (Array.isArray(platesData)) {
          rawItems = platesData
        } else if (Array.isArray(platesData.items)) {
          rawItems = platesData.items
        }

        if (rawItems.length > 0) {
          // 尝试从第一项获取真实的时间戳
          if (rawItems[0].timestamp) {
            apiTimestamp = rawItems[0].timestamp
          }

          // 重新根据 API 返回的真实时间戳确定日期分组
          const realDate = new Date(apiTimestamp * 1000).toLocaleDateString('sv')

          const { fields } = platesData
          if (Array.isArray(fields)) {
            const fieldMap = Object.fromEntries(fields.map((f: string, i: number) => [f, i]))
            plateRows = rawItems.map((item: any) => ({
              date: realDate,
              timestamp: apiTimestamp,
              plate_id: item[fieldMap['id']],
              name: item[fieldMap['name']],
              description: item[fieldMap['description']],
              created_at: Date.now()
            }))
          } else {
            plateRows = rawItems.map((item: any) => ({
              date: realDate,
              timestamp: apiTimestamp,
              plate_id: item.id,
              name: item.name,
              description: item.description,
              created_at: Date.now()
            }))
          }
        }
      }

      if (plateRows.length > 0) {
        surgeRepository.savePlatesBatch(plateRows)
      }

      // 2. 同步个股详情
      const dateStr = date.replace(/-/g, '')
      const stocksUrl = `${XuanguBaoConfig.API_BASE}${XuanguBaoConfig.ENDPOINTS.SURGE_STOCKS}?date=${dateStr}&normal=true&uplimit=true`
      const stocksData = await this.fetchWithValidation<any>(stocksUrl, `同步热点个股, 日期: ${date}`)

      if (!stocksData || !stocksData.items || !Array.isArray(stocksData.fields)) {
        log.warn(`${LogTags.XUANGUBAO} 热点个股数据格式不匹配或为空, 日期: ${date}`)
      } else {
        const { items, fields } = stocksData
        const fieldMap = Object.fromEntries(fields.map((f: string, i: number) => [f, i]))
        const itemsList = Array.isArray(items) ? items : []

        const realDate = new Date(apiTimestamp * 1000).toLocaleDateString('sv')

        const stockRows: SurgeStockRow[] = itemsList.map((item: any) => {
          const platesFields = item[fieldMap['plates']] || []
          const plateIds = Array.isArray(platesFields) ? platesFields.map((p: any) => p.id) : []

          return {
            date: realDate,
            timestamp: apiTimestamp, // 使用与板块一致的时间戳归类
            symbol: item[fieldMap['code']],
            stock_name: item[fieldMap['prod_name']],
            price: item[fieldMap['cur_price']],
            change_percent: item[fieldMap['px_change_rate']],
            description: item[fieldMap['description']],
            plate_ids: JSON.stringify(plateIds),
            is_limit_up: item[fieldMap['up_limit']] ? 1 : 0,
            enter_time: item[fieldMap['enter_time']],
            raw_data: JSON.stringify(item),
            created_at: Date.now()
          }
        })
        surgeRepository.saveStocksBatch(stockRows)

        // 3. 兜底逻辑：从个股中提取板块
        if (plateRows.length === 0 && stockRows.length > 0) {
          log.info(`${LogTags.XUANGUBAO} Plates API 无返回，从个股数据中提取板块...`)
          const extractedPlatesMap = new Map<number, SurgePlateRow>()

          itemsList.forEach((item: any) => {
            const platesFields = item[fieldMap['plates']] || []
            if (Array.isArray(platesFields)) {
              platesFields.forEach((p: any) => {
                if (!extractedPlatesMap.has(p.id)) {
                  extractedPlatesMap.set(p.id, {
                    date: realDate,
                    timestamp: apiTimestamp,
                    plate_id: p.id,
                    name: p.name,
                    description: p.description || '从个股数据中提取',
                    created_at: Date.now()
                  })
                }
              })
            }
          })

          if (extractedPlatesMap.size > 0) {
            surgeRepository.savePlatesBatch(Array.from(extractedPlatesMap.values()))
          }
        }
      }

      return true
    } catch (err) {
      log.error(`${LogTags.XUANGUBAO} syncSurgeData 异常:`, err)
      return false
    }
  }
}
