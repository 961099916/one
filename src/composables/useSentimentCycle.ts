import { ref, computed } from 'vue'
import { log } from '@/utils/logger'

export interface SentimentDay {
  date: string
  // 市场指标
  limitUpCount: number
  limitDownCount: number
  brokenCount: number
  temperature: number
  riseRatio: number // 涨跌比
  // 连板梯队
  matrix: Record<number, any[]> // board_count -> stocks[]
  maxBoard: number
  dragonStock: string // 空间板龙头
  // 核心情绪指标
  yesterdayProfit?: number // 昨日涨停今日平均涨幅
}

export function useSentimentCycle() {
  const loading = ref(false)
  const days = ref<string[]>([])
  const rawStats = ref<any[]>([])
  const rawPool = ref<any[]>([])

  /**
   * 核心数据聚合：将扁平化的数据库记录转存为矩阵结构
   */
  const sentimentMatrix = computed<SentimentDay[]>(() => {
    if (days.value.length === 0) return []

    return days.value.map(date => {
      // 1. 提取当日市场指标
      const stat = rawStats.value.find(s => s.date === date) || {}
      
      // 2. 提取当日涨停池记录
      const dayStocks = rawPool.value.filter(s => s.date === date)
      
      // 3. 构建连板梯度矩阵
      const matrix: Record<number, any[]> = {}
      let maxB = 0
      let dragon = '-'

      dayStocks.forEach(s => {
        const bCount = s.board_count || 1
        if (!matrix[bCount]) matrix[bCount] = []
        matrix[bCount].push(s)
        if (bCount > maxB) {
          maxB = bCount
          dragon = s.stock_name
        }
      })

      // 4. 计算涨跌比
      const riseCount = stat.rise_count || 0
      const fallCount = stat.fall_count || 0
      const riseRatio = fallCount === 0 ? 1 : riseCount / (riseCount + fallCount)

      return {
        date,
        limitUpCount: stat.limit_up_count || 0,
        limitDownCount: stat.limit_down_count || 0,
        brokenCount: stat.limit_up_broken_count || 0,
        temperature: stat.market_temperature || 0,
        riseRatio,
        matrix,
        maxBoard: maxB,
        dragonStock: dragon
      }
    })
  })

  const loadData = async (limit = 15) => {
    loading.value = true
    try {
      log.info('[useSentimentCycle] Loading sentiment data, limit:', limit)
      const res = await window.electronAPI.db.getSentimentCycle({ limit })
      
      days.value = res.days
      rawStats.value = res.stats
      rawPool.value = res.poolRecords
      
      log.info('[useSentimentCycle] Success, days loaded:', days.value.length)
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
