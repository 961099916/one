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

export function useSentimentCycle() {
  const loading = ref(false)
  const sentimentMatrix = ref<SentimentDay[]>([])

  /**
   * 加载情绪周期矩阵数据
   * 数据聚合逻辑已迁移至主进程，此处直接接收计算结果
   */
  const loadData = async (limit = 20) => {
    loading.value = true
    try {
      const res = await window.electronAPI.db.getSentimentCycle({ limit })
      // 现在的 res 已经是由主进程聚合好的 SentimentDay[] 数组
      sentimentMatrix.value = res || []
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
