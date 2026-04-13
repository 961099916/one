/**
 * 市场情绪分析服务
 * 负责聚合多个仓储的数据，提供高层级的情绪分析逻辑
 */
import log from 'electron-log'
import { marketDataRepository } from '../../infrastructure/database/repositories/marketDataRepository'
import { tradingDayRepository } from '../../infrastructure/database/repositories/tradingDayRepository'
import { stockPoolRepository } from '../../infrastructure/database/repositories/stockPoolRepository'
import { TdxService } from '../integration/tdxService'
import { appConfigOps } from '../../infrastructure/store/appConfig'
import type { SentimentDay } from '@common/types/market'

export class SentimentService {
  private static instance: SentimentService

  static getInstance(): SentimentService {
    if (!SentimentService.instance) {
      SentimentService.instance = new SentimentService()
    }
    return SentimentService.instance
  }

  /**
   * 获取情绪周期序列数据
   * 聚合了市场指标、连板梯队、晋级率及 TDX 增强数据
   */
  async getSentimentCycle(limit: number): Promise<SentimentDay[]> {
    const tdxService = TdxService.getInstance()
    const tdxPath = appConfigOps.get('tdxPath')

    // 1. 获取交易日列表 (多取一天用于计算首日晋级率)
    const tradingDays = tradingDayRepository.getLatestTradingDays(limit + 1)
    const days = tradingDays.map((d: any) => d.date)
    if (days.length === 0) return []

    // 2. 批量获取基础数据库记录
    const allStats = marketDataRepository.getDailySummary(days[days.length - 1], days[0])
    const allPoolRecords = stockPoolRepository.getLatestPoolRecordsByDates('limit_up', days)
    const allDownRecords = stockPoolRepository.getLatestPoolRecordsByDates('limit_down', days)
    
    // 3. 获取增强指标 (TDX)
    let tdxStats: Record<string, any> = {}
    let marketOverview: Record<string, any> = {}
    
    if (tdxPath) {
      try {
        tdxStats = await tdxService.getIndicesStats(tdxPath, limit + 1)
        
        // 构造昨日涨停映射，用于计算 profitAvg
        const yesterdayLimitUps: Record<string, string[]> = {}
        days.forEach((date: string) => {
          yesterdayLimitUps[date] = allPoolRecords
            .filter((r: any) => r.date === date)
            .map((r: any) => r.symbol)
        })
        
        marketOverview = await tdxService.getMarketOverview(tdxPath, days.slice(0, limit), yesterdayLimitUps)
      } catch (err) {
        log.error('[SentimentService] TDX 增强数据获取失败:', err)
      }
    }

    const isStStock = (stockName: string): boolean => {
      return stockName && (stockName.includes('ST') || stockName.includes('*ST'))
    }

    const results = days.slice(0, limit).map((date: string, index: number) => {
      const stat = allStats.find(s => s.date === date) || {}
      const dayStocks = allPoolRecords.filter(s => s.date === date && !isStStock(s.stock_name))
      const dayDownStocks = allDownRecords.filter(s => s.date === date && !isStStock(s.stock_name))
      const tdx = tdxStats[date] || {}
      const overview = marketOverview[date] || {}
      
      const matrix: Record<number, any[]> = {}
      const ladder: Record<number, number> = {}
      let maxB = 0
      let secondMaxB = 0
      let dragon = '-'
      const sectorMap = new Map<string, number>()

      dayStocks.forEach(s => {
        const bCount = s.board_count || 1
        if (!matrix[bCount]) matrix[bCount] = []
        matrix[bCount].push({
          symbol: s.symbol,
          stock_name: s.stock_name,
          reason_info: s.reason_info,
          board_count: s.board_count
        })
        ladder[bCount] = (ladder[bCount] || 0) + 1
        
        if (bCount > maxB) {
          secondMaxB = maxB
          maxB = bCount
          dragon = s.stock_name || '-'
        } else if (bCount > secondMaxB && bCount < maxB) {
          secondMaxB = bCount
        }

        const reason = s.reason_info || ''
        const plateMatch = reason.match(/\[(.*?)\]/)
        if (plateMatch && plateMatch[1]) {
          const plates = plateMatch[1].split(',').map((p: string) => p.trim())
          plates.forEach((p: string) => {
            sectorMap.set(p, (sectorMap.get(p) || 0) + 1)
          })
        }
      })

      let minDownB = 0
      let secondMinDownB = 0
      const downBoardCounts = dayDownStocks.map(s => {
        try {
          const rawData = JSON.parse(s.raw_data || '{}')
          const limitDown = rawData.limit_down_days
          
          if (limitDown && limitDown > 0) {
            return Number(limitDown)
          }
          return 1
        } catch {
          return 1
        }
      })
      if (downBoardCounts.length > 0) {
        minDownB = Math.max(...downBoardCounts)
        const uniqueCounts = [...new Set(downBoardCounts)].sort((a, b) => b - a)
        secondMinDownB = uniqueCounts.length > 1 ? uniqueCounts[1] : minDownB
      }

      const topSectors = Array.from(sectorMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const promotionRates: Record<number, number> = {}
      if (index < days.length - 1) {
        const prevDate = days[index + 1]
        const prevDayStocks = allPoolRecords.filter(s => s.date === prevDate)
        
        // 计算从 B 连板晋级到 B+1 连板的概率
        const possibleBoards = Array.from(new Set(prevDayStocks.map(s => s.board_count || 1)))
        possibleBoards.forEach(b => {
          const prevCount = prevDayStocks.filter(s => (s.board_count || 1) === b).length
          const currentPromotedCount = dayStocks.filter(s => (s.board_count || 1) === b + 1).length
          if (prevCount > 0) {
            promotionRates[b] = currentPromotedCount / prevCount
          }
        })
      }

      const riseCount = stat.rise_count || 0
      const fallCount = stat.fall_count || 0

      return {
        date,
        limitUpCount: stat.limit_up_count || 0,
        limitDownCount: stat.limit_down_count || 0,
        brokenCount: stat.limit_up_broken_count || 0,
        brokenRatio: stat.limit_up_broken_ratio || 0,
        temperature: stat.market_temperature || 0,
        riseCount,
        fallCount,
        riseRatio: (riseCount + fallCount) === 0 ? 0 : riseCount / (riseCount + fallCount),
        turnover: tdx.turnover,
        indexChange: tdx.changePercent,
        bigMeat: overview.bigMeat,
        bigFace: overview.bigFace,
        profitAvg: overview.profitAvg,
        matrix,
        ladder,
        maxBoard: maxB,
        secondMaxBoard: secondMaxB,
        dragonStock: dragon,
        minDownBoard: minDownB,
        secondMinDownBoard: secondMinDownB,
        promotionRates,
        topSectors
      }
    })

    return results as SentimentDay[]
  }
}
