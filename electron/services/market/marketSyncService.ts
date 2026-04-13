import { XuanguBaoService } from '../integration/xuangubaoService'
import { marketDataOps, tradingDayOps } from '../../infrastructure/database'
import log from 'electron-log'

export class MarketSyncService {
  private static instance: MarketSyncService
  private xgb: XuanguBaoService

  private constructor() {
    this.xgb = XuanguBaoService.getInstance()
  }

  public static getInstance(): MarketSyncService {
    if (!MarketSyncService.instance) {
      MarketSyncService.instance = new MarketSyncService()
    }
    return MarketSyncService.instance
  }

  /**
   * 同步单日市场大盘指标
   */
  public async syncMarketIndicatorForDate(date: string, force: boolean = false): Promise<{ synced: boolean, count: number }> {
    if (!force && tradingDayOps.isNonTrading(date)) {
      log.info(`[Sync] 日期 ${date} 已知休市，跳过`)
      return { synced: false, count: 0 }
    }

    if (force) {
      marketDataOps.deleteByDate(date)
    }

    const data = await this.xgb.getMarketIndicator(date)
    let isRealTradingDay = false
    let validData: any[] = []
    
    if (data && data.length > 0) {
      const firstPointDate = new Date(data[0].timestamp * 1000).toLocaleDateString('sv')
      if (firstPointDate === date) {
        isRealTradingDay = true
        validData = data.map(item => ({
          timestamp: item.timestamp,
          rise_count: item.rise_count,
          fall_count: item.fall_count,
          limit_up_count: item.limit_up_count,
          limit_down_count: item.limit_down_count,
          limit_up_broken_count: item.limit_up_broken_count,
          limit_up_broken_ratio: item.limit_up_broken_ratio,
          market_temperature: item.market_temperature
        }))
      } else {
        log.info(`[Sync] 日期 ${date} 的 API 返回数据所属日期为 ${firstPointDate}，判定 ${date} 为休市`)
      }
    }

    if (isRealTradingDay) {
      marketDataOps.saveBatch(date, validData)
      tradingDayOps.saveStatus(date, true)
      return { synced: true, count: validData.length }
    } else {
      const todayStr = new Date().toLocaleDateString('sv')
      if (date < todayStr) {
        tradingDayOps.saveStatus(date, false)
        log.info(`[Sync] 历史日期 ${date} 已确认为休市并缓存状态`)
      }
      return { synced: false, count: 0 }
    }
  }

  /**
   * 批量同步特定范围内的市场指标数据
   */
  public async syncMarketDataRange(startDate: string, endDate: string, force: boolean = false) {
    const results = { success: true, count: 0, messages: [] as string[] }
    const dateList = this.generateDateList(startDate, endDate)

    for (const date of dateList) {
      const { count } = await this.syncMarketIndicatorForDate(date, force)
      results.count += count
    }
    
    return results
  }

  /**
   * 一键大满贯，批量同步选股通的指标数据与各种股票池及热点数据
   */
  public async batchSyncAllXuangubaoData(startDate: string, endDate: string, force: boolean = false) {
    const results = { 
      success: true, 
      dateCount: 0, 
      syncCount: 0,
      errors: [] as string[] 
    }
    const pools = ['limit_up', 'broken_limit_up', 'limit_down', 'strong_stock', 'yesterday_limit_up']
    const dateList = this.generateDateList(startDate, endDate)

    for (const date of dateList) {
      if (!force && tradingDayOps.isNonTrading(date)) continue

      results.dateCount++
      log.info(`[Batch Sync] 正在同步日期 ${date}...`)

      // A. 同步市场指标及交易日判定
      let isRealTradingDay = false
      try {
        const res = await this.syncMarketIndicatorForDate(date, force)
        isRealTradingDay = res.synced
        if (isRealTradingDay) results.syncCount++
      } catch (err) {
        log.error(`[Batch Sync] 同步 ${date} 市场指标失败:`, err)
        results.errors.push(`${date} 市场指标同步失败`)
      }

      if (!isRealTradingDay) continue // 休市则跳过后续操作

      // B. 同步所有股票池
      for (const poolName of pools) {
        try {
          await this.xgb.syncStockPool(poolName, date)
        } catch (err) {
          log.error(`[Batch Sync] 同步 ${date} 股票池 ${poolName} 失败:`, err)
          results.errors.push(`${date} ${poolName} 同步失败`)
        }
      }

      // C. 同步每日热点数据
      try {
        await this.xgb.syncSurgeData(date)
      } catch (err) {
        log.error(`[Batch Sync] 同步 ${date} 每日热点失败:`, err)
        results.errors.push(`${date} 每日热点同步失败`)
      }
    }
    return results
  }

  private generateDateList(startDate: string, endDate: string): string[] {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dateList: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dateStr = String(d.getDate()).padStart(2, '0')
      dateList.push(`${y}-${m}-${dateStr}`)
    }
    return dateList
  }
}
