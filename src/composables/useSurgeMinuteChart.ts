import { ref, type Ref } from 'vue'
import { normalizeStockSymbol } from '@common/utils/stockCode'
import { tdxApi } from '@/api'
import type { SurgeStock } from '@common/types/market'

interface MinuteDataPoint {
  time: string
  price: number
  volume: number
  amount: number
  avg_price: number
  close: number
}

interface ChartSeriesItem {
  name: string
  type: 'line'
  showSymbol: boolean
  data: Array<{ name: string; value: [string, string] }>
  lineStyle: { width: number }
  emphasis: { focus: 'series' }
}

export function useSurgeMinuteChart(
  tdxPath: Ref<string>,
  activeDate: Ref<string>,
  overlayN: Ref<number>,
  sortedStocks: Ref<SurgeStock[]>
) {
  const chartOption = ref<any>(null) // ECharts 配置项较为复杂，暂时保留 any 或使用 ECOption
  const chartLoading = ref(false)
  const activeStock = ref<SurgeStock | null>(null)

  const updateChart = async (stock?: SurgeStock) => {
    if (stock) activeStock.value = stock
    if (!tdxPath.value) return

    chartLoading.value = true
    try {
      let targets: SurgeStock[] = []
      if (overlayN.value === 0) {
        targets = sortedStocks.value
      } else {
        if (activeStock.value) {
          targets.push(activeStock.value)
        }
        
        const others = sortedStocks.value.filter(s => s.symbol !== activeStock.value?.symbol)
        const needReplaceCount = overlayN.value - targets.length
        if (needReplaceCount > 0) {
          targets.push(...others.slice(0, needReplaceCount))
        }
      }

      const series: ChartSeriesItem[] = []
      const legendData: string[] = []

      const fetchAll = targets.map(async (target) => {
        const symbol = normalizeStockSymbol(target.symbol)

        const res = await tdxApi.getMinuteData({
          tdxPath: tdxPath.value,
          symbol,
          date: activeDate.value,
          period: '5'
        }).catch(() => null) as MinuteDataPoint[] | null

        if (res && Array.isArray(res) && res.length > 0) {
          const currentPrice = target.price || res[res.length-1].close
          const changePercent = target.change_percent || 0
          const refPrice = currentPrice / (1 + changePercent)
          
          const data = res.map((item) => ({
            name: item.time,
            value: [item.time, ((item.close - refPrice) / refPrice * 100).toFixed(2)] as [string, string]
          }))

          legendData.push(target.stock_name)
          series.push({
            name: target.stock_name,
            type: 'line',
            showSymbol: false,
            data,
            lineStyle: { width: target.symbol === activeStock.value?.symbol ? 3 : 1.5 },
            emphasis: { focus: 'series' }
          })
        }
      })

      await Promise.all(fetchAll)

      if (series.length === 0) {
        chartOption.value = null
        return
      }

      chartOption.value = {
        animation: false,
        color: ['#165dff', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'],
        tooltip: {
          trigger: 'axis',
          confine: true,
          formatter: (params: any[]) => {
            let res = `<div style="font-weight: bold; margin-bottom: 5px">${params[0].value[0]}</div>`
            params.sort((a, b) => parseFloat(b.value[1]) - parseFloat(a.value[1])).forEach((p) => {
              res += `<div style="display: flex; justify-content: space-between; gap: 20px">
                <span>${p.marker} ${p.seriesName}:</span>
                <span style="font-weight: bold; color: ${p.value[1] >= 0 ? '#ef4444' : '#22c55e'}">${p.value[1]}%</span>
              </div>`
            })
            return res
          }
        },
        legend: { top: 0, type: 'scroll', data: legendData },
        grid: { top: 60, left: 50, right: 20, bottom: 30 },
        xAxis: {
          type: 'time',
          splitLine: { show: false },
          axisLabel: {
            formatter: (value: number) => {
              const d = new Date(value)
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: '{value}%' },
          splitLine: { lineStyle: { type: 'dashed', color: 'var(--border-color)' } }
        },
        series: series
      }
    } catch (err) {
      console.error('[SurgeMinuteChart] 加载分时对比失败:', err)
      chartOption.value = null
    } finally {
      chartLoading.value = false
    }
  }

  return {
    chartOption,
    chartLoading,
    activeStock,
    updateChart
  }
}
