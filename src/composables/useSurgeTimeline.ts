import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { marketApi } from '@/api'
import type { SurgeStockRow, SurgePlateRow } from '@common/types/market'
import type { TimelineDay, PlateDetail, SurgeStock, SurgeStockRawData } from '@common/types/market'
import { nextTick } from 'vue'

export function useSurgeTimeline() {
  const message = useMessage()
  const loading = ref(false)
  const timelineData = ref<TimelineDay[]>([])

  const loadTimeline = async () => {
    loading.value = true
    try {
      const dates = await marketApi.getSurgeHistoricalDates()
      const detailPromises = dates.map(async (date: string) => {
        const pData: SurgePlateRow[] = await marketApi.getSurgePlates({ date })
        const sData: SurgeStockRow[] = await marketApi.getSurgeStocks({ date })
        
        // 预解析所有股票的 raw_data
        const processedStocks: SurgeStock[] = sData.map(s => {
          let parsedRawData: SurgeStockRawData = {}
          try {
            if (s.raw_data) {
              parsedRawData = JSON.parse(s.raw_data)
            }
          } catch (e) {
            console.error('解析股票原始数据失败:', s.symbol, e)
          }
          return { ...s, parsedRawData }
        })

        const platesWithMetadata: PlateDetail[] = pData.map(p => {
          const relatedStocks = processedStocks.filter(s => {
            try { 
              const plateIds = JSON.parse(s.plate_ids || '[]')
              return Array.isArray(plateIds) && plateIds.includes(p.plate_id)
            } 
            catch { return false }
          })
          const limitUpCount = relatedStocks.filter(s => s.is_limit_up).length
          return {
            ...p,
            stockCount: relatedStocks.length,
            limitUpCount: limitUpCount,
            stocks: relatedStocks
          }
        })
        
        // 板块排序逻辑：同一天内按涨停股数降序排列
        platesWithMetadata.sort((a, b) => b.limitUpCount - a.limitUpCount || b.stockCount - a.stockCount)
        
        return { date, plates: platesWithMetadata }
      })

      const results = await Promise.all(detailPromises)
      // 调整为升序排序：从左往右（旧 -> 新）
      timelineData.value = results.sort((a, b) => a.date.localeCompare(b.date))
      
      // 自动滚动到最右侧（最新数据）
      nextTick(() => {
        const scrollArea = document.querySelector('.panorama-scroll-area')
        if (scrollArea) {
          scrollArea.scrollLeft = scrollArea.scrollWidth
        }
      })
    } catch (err) {
      console.error('[SurgeTimeline] 加载失败:', err)
      message.error('看板加载失败')
    } finally {
      loading.value = false
    }
  }

  const syncTodayData = async () => {
    loading.value = true
    try {
      let syncDate = new Date().toLocaleDateString('sv')
      const latestDay = await marketApi.getLatestTradingDay()
      if (latestDay) {
        syncDate = latestDay.date
      }

      const res = await marketApi.syncSurgeData(syncDate)
      if (res.success) {
        message.success('同步成功')
        await loadTimeline()
      } else {
        message.error('同步失败')
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    timelineData,
    loadTimeline,
    syncTodayData
  }
}
