import { ref, computed } from 'vue'
import { log } from '@/utils/logger'

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
  dragonStock: string
  // 晋级率
  promotionRates: Record<number, number> // N -> N+1 晋级率
  // 核心题材
  topSectors: Array<{ name: string, count: number }>
}

export function useSentimentCycle() {
  const loading = ref(false)
  const days = ref<string[]>([])
  const rawStats = ref<any[]>([])
  const rawPool = ref<any[]>([])
  const tdxStats = ref<Record<string, any>>({})
  const marketOverview = ref<Record<string, any>>({})

  /**
   * 核心数据聚合逻辑
   */
  const sentimentMatrix = computed<SentimentDay[]>(() => {
    if (days.value.length === 0) return []

    const results = days.value.map((date, index) => {
      const stat = (rawStats.value || []).find(s => s.date === date) || {}
      const dayStocks = (rawPool.value || []).filter(s => s.date === date)
      const tdx = tdxStats.value[date] || {}
      const overview = marketOverview.value[date] || {}
      
      const matrix: Record<number, any[]> = {}
      const ladder: Record<number, number> = {}
      let maxB = 0
      let dragon = '-'
      const sectorMap = new Map<string, number>()

      dayStocks.forEach(s => {
        const bCount = s.board_count || 1
        if (!matrix[bCount]) matrix[bCount] = []
        matrix[bCount].push(s)
        ladder[bCount] = (ladder[bCount] || 0) + 1
        
        if (bCount > maxB) {
          maxB = bCount
          dragon = s.stock_name
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

      const topSectors = Array.from(sectorMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const promotionRates: Record<number, number> = {}
      if (index < days.value.length - 1) {
        const prevDate = days.value[index + 1]
        const prevDayStocks = (rawPool.value || []).filter(s => s.date === prevDate)
        
        for (let b = 1; b <= maxB; b++) {
          const prevCount = prevDayStocks.filter(s => (s.board_count || 1) === b).length
          const currentPromotedCount = dayStocks.filter(s => (s.board_count || 1) === b + 1).length
          if (prevCount > 0) {
            promotionRates[b] = currentPromotedCount / prevCount
          }
        }
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
        dragonStock: dragon,
        promotionRates,
        topSectors
      }
    })

    return results.slice(0, -1)
  })

  const loadData = async (limit = 20) => {
    loading.value = true
    try {
      const res = await window.electronAPI.db.getSentimentCycle({ limit })
      days.value = res.days
      rawStats.value = res.stats
      rawPool.value = res.poolRecords
      tdxStats.value = res.tdxStats || {}
      marketOverview.value = res.marketOverview || {}
    } catch (err) {
      log.error('[useSentimentCycle] Failed to load data:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    sentimentMatrix,
    loadData
  }
}
