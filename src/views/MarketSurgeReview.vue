<template>
  <div class="market-surge-review">
    <!-- 全屏横向复盘看板 -->
    <div class="board-header">
      <div class="header-left">
        <h2 class="title">热点深度复盘全景图</h2>
        <n-text depth="3" class="subtitle">题材按涨停强度排序 · 连板高度精细复盘</n-text>
      </div>
      <div class="header-actions">
        <n-checkbox v-model:checked="hideST" class="global-filter">全局过滤 ST</n-checkbox>
        <n-button secondary type="info" size="small" :loading="loading" @click="loadTimeline">
          <template #icon><n-icon><RefreshOutline /></n-icon></template>
          刷新看板
        </n-button>
        <n-button secondary size="small" @click="syncTodayData">
          同步最新数据
        </n-button>
      </div>
    </div>

    <!-- 核心看板区域：全横向滚动 -->
    <div 
      class="panorama-scroll-area"
      ref="panoramaRef"
      @mousedown="onTimelineMouseDown"
      :class="{ 'is-dragging': isDraggingTimeline }"
    >
      <div class="timeline-wrapper">
        <div 
          v-for="item in processedTimelineData" 
          :key="item.date" 
          class="day-column"
          :class="{ 'is-today': isToday(item.date) }"
        >
          <!-- 日期头部 -->
          <div class="date-header">
            <div class="date-text">{{ formatDateStr(item.date) }}</div>
            <div class="date-dot"></div>
          </div>

          <!-- 题材分支流：按涨停股数排序 -->
          <div class="plate-flow">
            <div 
              v-for="plate in item.plates" 
              :key="plate.plate_id" 
              class="plate-card-wrapper"
              @click="openDetail(plate, item.date)"
            >
              <div class="connector-line"></div>
              <n-card 
                size="small" 
                class="plate-card premium-card"
                :class="{ 'has-limit-up': plate.limitUpCount > 0 }"
                :style="getPlateCardStyle(plate)"
              >
                <div class="plate-name">{{ plate.name }}</div>
                <div class="plate-stats">
                  <n-badge :value="plate.limitUpCount" :max="99" type="error" :show="plate.limitUpCount > 0" />
                  <n-text depth="3" class="stock-count-text">
                    {{ plate.stockCount }}只相关
                  </n-text>
                </div>
              </n-card>
            </div>
          </div>
        </div>
        
        <div v-if="timelineData.length === 0 && !loading" class="empty-placeholder">
          <n-empty description="暂无历史复盘数据，请先同步数据" size="large">
            <template #extra>
              <n-button type="primary" @click="syncTodayData">立即同步</n-button>
            </template>
          </n-empty>
        </div>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <n-drawer v-model:show="showDrawer" :width="drawerWidth" placement="right">
      <div class="drawer-resizer" @mousedown="onResizerMouseDown"></div>
      <n-drawer-content closable>
        <template #header>
          <div class="drawer-header">
            <div class="header-title">
              <span class="plate-title">{{ activePlate?.name }}</span>
              <n-tag size="small" :bordered="false" type="info" round class="date-tag">{{ activeDate }}</n-tag>
            </div>
            <div class="header-filters">
              <n-text depth="3" style="font-size: 12px">已启用全局 ST 过滤</n-text>
            </div>
          </div>
        </template>
        
        <div class="drawer-body">
          <!-- 分时对比图区域 -->
          <div class="chart-container">
            <div class="chart-toolbar">
              <div class="toolbar-left">
                <span class="active-stock-label" v-if="activeStock">
                  正在查看: <span class="highlight">{{ activeStock.stock_name }}</span>
                </span>
              </div>
              <div class="toolbar-right">
                <span class="overlay-label">展示个股总数:</span>
                <n-input-number 
                  v-model:value="overlayN" 
                  size="tiny" 
                  class="overlay-input"
                  :min="0" 
                  :max="20" 
                  placeholder="0=全部"
                  @update:value="updateChart()"
                />
              </div>
            </div>
            
            <div v-if="!tdxPath" class="chart-placeholder">
              <n-text depth="3">请先在设置中配置通达信路径以开启分时对比</n-text>
            </div>
            <v-chart 
              v-else-if="chartOption" 
              class="intraday-chart" 
              :option="chartOption" 
              autoresize 
            />
            <div v-else-if="chartLoading" class="chart-placeholder">
              <n-spin size="small" />
              <n-text depth="3" style="margin-left: 8px">正在从本地解析分时数据...</n-text>
            </div>
            <div v-else class="chart-placeholder">
              <n-text depth="3">本地未找到该日分时数据 (请确认通达信已下载盘后数据)</n-text>
            </div>
          </div>

          <n-text depth="3" class="plate-desc">{{ activePlate?.description }}</n-text>
          
          <n-data-table
            size="small"
            :columns="columns"
            :data="sortedStocks"
            :loading="loading"
            :bordered="false"
            :max-height="'calc(100vh - 450px)'"
            class="detail-table"
            :row-props="rowProps"
          />
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { 
  useMessage, NTag, NText, NCard, NButton, 
  NDataTable, NEmpty, NIcon, NDrawer, NDrawerContent,
  NBadge, NCheckbox, NSpin
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import type { SurgeStockRow } from '../../electron/infrastructure/database/types'
import { useAppStore } from '@/stores'
import { useStockActions } from '@/composables/useStockActions'

const { openInTdx } = useStockActions()
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
])

const appStore = useAppStore()
const tdxPath = computed(() => appStore.settings.tdxPath)

const message = useMessage()

// 状态定义
interface PlateDetail extends any {
  stockCount: number
  limitUpCount: number
  stocks: SurgeStockRow[]
}

interface TimelineDay {
  date: string
  plates: PlateDetail[]
}

const timelineData = ref<TimelineDay[]>([])
const loading = ref(false)
const showDrawer = ref(false)
const activePlate = ref<PlateDetail | null>(null)
const activeDate = ref('')
const activeStock = ref<SurgeStockRow | null>(null)
const hideST = ref(true)

// 图表相关
const chartOption = ref<any>(null)
const chartLoading = ref(false)

const drawerWidth = ref(800) /* 增加列后宽度稍大 */
let isResizing = false
const overlayN = ref(0) // 叠加前N个，0为全部

const onResizerMouseDown = (e: MouseEvent) => {
  isResizing = true
  document.addEventListener('mousemove', onResizerMouseMove)
  document.addEventListener('mouseup', onResizerMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const onResizerMouseMove = (e: MouseEvent) => {
  if (!isResizing) return
  const newWidth = window.innerWidth - e.clientX
  if (newWidth > 300 && newWidth < 1200) {
    drawerWidth.value = newWidth
  }
}

const onResizerMouseUp = () => {
  isResizing = false
  document.removeEventListener('mousemove', onResizerMouseMove)
  document.removeEventListener('mouseup', onResizerMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 时间轴水平拖拽相关
const panoramaRef = ref<HTMLElement | null>(null)
const isDraggingTimeline = ref(false)
let dragStartX = 0
let dragStartScrollLeft = 0
let dragHasMoved = false

const onTimelineMouseDown = (e: MouseEvent) => {
  if (!panoramaRef.value || e.button !== 0) return 
  
  // 排除掉卡片点击，只有点击空白或包裹层才触发
  isDraggingTimeline.value = true
  dragHasMoved = false
  dragStartX = e.pageX - panoramaRef.value.offsetLeft
  dragStartScrollLeft = panoramaRef.value.scrollLeft
  
  window.addEventListener('mousemove', onTimelineMouseMove)
  window.addEventListener('mouseup', onTimelineMouseUp)
}

const onTimelineMouseMove = (e: MouseEvent) => {
  if (!isDraggingTimeline.value || !panoramaRef.value) return
  
  const x = e.pageX - panoramaRef.value.offsetLeft
  const walk = (x - dragStartX) * 1.5 
  
  if (Math.abs(walk) > 5) {
    dragHasMoved = true
  }
  
  panoramaRef.value.scrollLeft = dragStartScrollLeft - walk
}

const onTimelineMouseUp = () => {
  isDraggingTimeline.value = false
  window.removeEventListener('mousemove', onTimelineMouseMove)
  window.removeEventListener('mouseup', onTimelineMouseUp)
}

// ---------------- 数据加载与预处理 ----------------

const loadTimeline = async () => {
  loading.value = true
  try {
    const dates = await window.electronAPI.db.getSurgeHistoricalDates()
    const detailPromises = dates.map(async (date) => {
      const pData = await window.electronAPI.db.getSurgePlates({ date })
      const sData = await window.electronAPI.db.getSurgeStocks({ date })
      
      const platesWithMetadata = pData.map(p => {
        const relatedStocks = sData.filter(s => {
          try { return JSON.parse(s.plate_ids || '[]').includes(p.plate_id) } 
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
    import('vue').then(({ nextTick }) => {
      nextTick(() => {
        const scrollArea = document.querySelector('.panorama-scroll-area')
        if (scrollArea) {
          scrollArea.scrollLeft = scrollArea.scrollWidth
        }
      })
    })
  } catch (err) {
    message.error('看板加载失败')
  } finally {
    loading.value = false
  }
}

const syncTodayData = async () => {
  loading.value = true
  try {
    let syncDate = new Date().toLocaleDateString('sv')
    
    // 如果今天还没开盘或没数据，尝试同步最近一个交易日的数据
    const latestDay = await window.electronAPI.db.getLatestTradingDay()
    if (latestDay) {
      syncDate = latestDay.date
    }

    const res = await window.electronAPI.db.syncSurgeData(syncDate)
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

// ---------------- 详情抽屉与排序过滤 ----------------

const openDetail = (plate: PlateDetail, date: string) => {
  if (dragHasMoved) return // 拖拽时不触发点击
  
  activePlate.value = plate
  activeDate.value = date
  showDrawer.value = true
  
  // 默认选中第一个标的显示分时
  if (plate.stocks.length > 0) {
    const list = [...plate.stocks].sort((a, b) => b.is_limit_up - a.is_limit_up)
    updateChart(list[0])
  } else {
    chartOption.value = null
  }
}

const rowProps = (row: SurgeStockRow) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      // 如果点击的是股票名称（通过类名判断），则不更新图表，而是由 render 函数中的点击事件处理
      const target = e.target as HTMLElement
      if (target.classList.contains('stock-click-link')) return
      
      updateChart(row)
    }
  }
}

const handleStockClick = (row: SurgeStockRow) => {
  openInTdx(row.symbol)
}

// 全局过滤与预处理后的时间轴数据
const processedTimelineData = computed(() => {
  return timelineData.value.map(day => {
    const processedPlates = day.plates.map(plate => {
      // 执行 ST 过滤
      let filteredStocks = plate.stocks
      if (hideST.value) {
        filteredStocks = filteredStocks.filter(s => !s.stock_name.includes('ST'))
      }
      
      const limitUpCount = filteredStocks.filter(s => s.is_limit_up).length
      return {
        ...plate,
        stockCount: filteredStocks.length,
        limitUpCount: limitUpCount,
        filteredStocks // 保存过滤后的列表供抽屉使用
      }
    })
    
    // 过滤后重新排序：按涨停股数降序
    const sortedPlates = [...processedPlates].sort((a, b) => b.limitUpCount - a.limitUpCount || b.stockCount - a.stockCount)
    
    return { ...day, plates: sortedPlates }
  })
})

const sortedStocks = computed(() => {
  // 从 processedTimelineData 中找到当前激活的板块数据（确保过滤逻辑同步）
  if (!activePlate.value) return []
  
  const currentDay = processedTimelineData.value.find(d => d.date === activeDate.value)
  const currentPlate = currentDay?.plates.find(p => p.plate_id === activePlate.value?.plate_id)
  
  if (!currentPlate) return []
  
  let list = [...currentPlate.filteredStocks]

  // 深度排序
  return list.sort((a, b) => {
    const getBoardCount = (row: any) => {
      try {
        const raw = JSON.parse(row.raw_data || '{}')
        return raw.limit_up_days || 0
      } catch { return 0 }
    }
    
    if (a.is_limit_up !== b.is_limit_up) {
      return b.is_limit_up - a.is_limit_up
    }
    
    if (a.is_limit_up) {
      const countA = getBoardCount(a)
      const countB = getBoardCount(b)
      if (countB !== countA) return countB - countA
      return (a.enter_time || 0) - (b.enter_time || 0)
    } else {
      return (b.change_percent || 0) - (a.change_percent || 0)
    }
  })
})

const columns = [
  {
    title: '股票',
    key: 'stock_name',
    width: 140,
    render(row: any) {
      return h('div', [
        h(
          NText, 
          { 
            strong: true, 
            class: 'stock-clickable',
            onClick: (e: MouseEvent) => {
              e.stopPropagation()
              handleStockClick(row)
            }
          }, 
          { default: () => row.stock_name }
        ),
        h('div', { style: 'font-size: 11px; color: #999' }, row.symbol)
      ])
    }
  },
  {
    title: '高度',
    key: 'height',
    width: 70,
    render(row: any) {
      if (!row.is_limit_up) return null
      try {
        const raw = JSON.parse(row.raw_data || '{}')
        const count = raw.limit_up_days || 1
        return h(NTag, { type: 'error', size: 'tiny', bordered: false, round: true }, { default: () => `${count}板` })
      } catch { return null }
    }
  },
  {
    title: '涨跌幅',
    key: 'change_percent',
    width: 80,
    render(row: any) {
      const val = row.change_percent || 0
      const color = val > 0 ? '#ef4444' : val < 0 ? '#22c55e' : 'inherit'
      return h('span', { style: { color, fontWeight: 'bold' } }, 
        `${val > 0 ? '+' : ''}${(val * 100).toFixed(2)}%`
      )
    }
  },
  {
    title: '换手',
    key: 'turnover',
    width: 70,
    render(row: any) {
      try {
        const raw = JSON.parse(row.raw_data || '{}')
        return h(NText, { depth: 3, style: 'font-size: 11px' }, { default: () => `${(raw.turnover_ratio * 100 || 0).toFixed(2)}%` })
      } catch { return '-' }
    }
  },
  {
    title: '市值',
    key: 'm_cap',
    width: 70,
    render(row: any) {
      try {
        const raw = JSON.parse(row.raw_data || '{}')
        return h(NText, { depth: 3, style: 'font-size: 11px' }, { default: () => `${(raw.total_capital / 100000000 || 0).toFixed(1)}亿` })
      } catch { return '-' }
    }
  },
  {
    title: '时点',
    key: 'enter_time',
    width: 70,
    render(row: any) {
      if (!row.enter_time) return '-'
      const date = new Date(row.enter_time * 1000)
      return h(NText, { depth: 3, style: 'font-size: 11px' }, { default: () => date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
    }
  },
  {
    title: '涨停原因',
    key: 'reason',
    render(row: any) {
      try {
        const raw = JSON.parse(row.raw_data || '{}')
        const reason = raw.surge_reason?.stock_reason || row.description || '-'
        return h(NText, { depth: 3, style: 'font-size: 12px' }, { default: () => reason })
      } catch { return row.description || '-' }
    }
  }
]

// ---------------- 分时图核心逻辑 ----------------

const updateChart = async (stock?: SurgeStockRow) => {
  if (stock) activeStock.value = stock
  if (!activePlate.value || !tdxPath.value) return

  chartLoading.value = true
  try {
    // 1. 确定要显示的个股列表
    let targets: SurgeStockRow[] = []
    if (overlayN.value === 0) {
      // 0 代表展示全部
      targets = sortedStocks.value
    } else {
      // N > 0 代表总展示数量（含当前点击的一只）
      if (activeStock.value) {
        targets.push(activeStock.value)
      }
      
      // 用板块内排名靠前的个股补齐剩余名额
      const others = sortedStocks.value.filter(s => s.symbol !== activeStock.value?.symbol)
      const needReplaceCount = overlayN.value - targets.length
      if (needReplaceCount > 0) {
        targets.push(...others.slice(0, needReplaceCount))
      }
    }

    log.info('[MarketSurgeReview] 正在请求叠加分时数据, 目标数:', targets.length)

    const series: any[] = []
    const legendData: string[] = []

    const fetchAll = targets.map(async (target) => {
      let symbol = target.symbol.toUpperCase()
      if (symbol.endsWith('.SS') || symbol.endsWith('.SH')) symbol = 'SH' + symbol.split('.')[0]
      else if (symbol.endsWith('.SZ')) symbol = 'SZ' + symbol.split('.')[0]
      else {
        const pureCode = symbol.replace(/[^0-9]/g, '')
        if (pureCode.startsWith('6')) symbol = 'SH' + pureCode
        else symbol = 'SZ' + pureCode
      }

      const res = await window.electronAPI.tdx.getMinuteData({
        tdxPath: tdxPath.value,
        symbol,
        date: activeDate.value,
        period: '5'
      }).catch(() => null)

      if (res && Array.isArray(res) && res.length > 0) {
        // 核心算法纠偏：使用昨日收盘价作为 0% 点
        // refPrice = currentPrice / (1 + change_percent)
        const currentPrice = target.price || res[res.length-1].close
        const changePercent = target.change_percent || 0
        const refPrice = currentPrice / (1 + changePercent)
        
        const data = res.map((item: any) => ({
          name: item.time,
          value: [item.time, ((item.close - refPrice) / refPrice * 100).toFixed(2)]
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
        formatter: (params: any) => {
          let res = `<div style="font-weight: bold; margin-bottom: 5px">${params[0].value[0]}</div>`
          params.sort((a: any, b: any) => b.value[1] - a.value[1]).forEach((p: any) => {
            res += `<div style="display: flex; justify-content: space-between; gap: 20px">
              <span>${p.marker} ${p.seriesName}:</span>
              <span style="font-weight: bold; color: ${p.value[1] >= 0 ? '#ef4444' : '#22c55e'}">${p.value[1]}%</span>
            </div>`
          })
          return res
        }
      },
      legend: {
        top: 0,
        type: 'scroll',
        data: legendData
      },
      grid: {
        top: 60,
        left: 50,
        right: 20,
        bottom: 30
      },
      xAxis: {
        type: 'time',
        splitLine: { show: false },
        axisLabel: {
          formatter: (value: any) => {
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
    log.error('加载分时对比失败', err)
    chartOption.value = null
  } finally {
    chartLoading.value = false
  }
}

const getPlateCardStyle = (plate: PlateDetail) => {
  const intensity = Math.min(plate.limitUpCount / 5, 1)
  return {
    borderLeft: `3px solid rgba(22, 93, 255, ${0.3 + intensity * 0.7})`,
    backgroundColor: intensity > 0.4 ? 'rgba(22, 93, 255, 0.04)' : 'var(--bg-primary)'
  }
}

const formatDateStr = (date: string) => {
  const parts = date.split('-')
  return `${parts[1]}-${parts[2]}`
}

const latestTradingDate = ref('')

const isToday = (date: string) => {
  if (latestTradingDate.value) return date === latestTradingDate.value
  return date === new Date().toLocaleDateString('sv')
}

onMounted(async () => {
  try {
    const latestDay = await window.electronAPI.db.getLatestTradingDay()
    if (latestDay) {
      latestTradingDate.value = latestDay.date
    }
  } catch (e) {
    console.error('Failed to get latest trading day:', e)
  }
  loadTimeline()
})
</script>

<style scoped>
.market-surge-review {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.board-header {
  padding: 24px 40px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  box-shadow: var(--shadow-sm);
  z-index: 100;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--primary-color);
  letter-spacing: 0.5px;
}

.header-actions {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.global-filter {
  font-weight: 600;
  color: var(--text-secondary);
}

/* 全景滚动区 */
.panorama-scroll-area {
  flex: 1;
  height: 0; /* 激活 flex-child 高度计算的核心 */
  min-height: 0;
  overflow: hidden;
  padding: 20px 0 0 0;
  display: flex;
  flex-direction: column;
}

.panorama-scroll-area.is-dragging {
  cursor: grabbing;
}

.timeline-wrapper {
  flex: 1;
  display: flex;
  padding: 0 100px;
  min-width: fit-content;
  height: 100%;
  align-items: stretch;
  margin: 0 auto;
  position: relative;
}

.day-column {
  width: 220px;
  height: 100%; /* 继承 stretch 高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex-shrink: 0;
  padding-bottom: 20px;
  overflow: hidden;
}

.date-header {
  margin-bottom: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

.date-text {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 12px;
  background: var(--bg-primary);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.is-today .date-text {
  color: #fff;
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.date-dot {
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border: 4px solid var(--bg-app);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--primary-color);
}

/* 贯穿全线的主轴 */
.timeline-wrapper::before {
  content: '';
  position: absolute;
  top: 105px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--border-color-strong), transparent);
  opacity: 0.3;
  z-index: 1;
}

.plate-flow {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding-top: 15px;
  overflow-y: auto;
  min-height: 0;
  max-height: 100%; /* 约束在列高之内 */
}

.plate-flow::-webkit-scrollbar {
  width: 4px;
}
.plate-flow::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.plate-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.connector-line {
  width: 2px;
  height: 12px;
  background-color: var(--border-color);
}

.plate-card {
  width: 180px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.plate-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.plate-card.has-limit-up {
  border-color: rgba(22, 93, 255, 0.2);
  background: var(--bg-primary);
}

.plate-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.plate-stats {
  display: flex;
  align-items: center;
}

/* 抽屉样式 */
.drawer-resizer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s;
}

.drawer-resizer:hover,
.drawer-resizer:active {
  background-color: rgba(59, 130, 246, 0.3);
  border-left: 1px solid #3b82f6;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.plate-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary-color);
}

.date-tag {
  margin-left: 12px;
  font-family: tabular-nums;
}

.plate-desc {
  display: block;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* 详情图表区域 */
.chart-container {
  height: 340px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.chart-toolbar {
  height: 40px;
  padding: 0 16px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.active-stock-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.active-stock-label .highlight {
  color: #ef4444;
  font-weight: 800;
  margin: 0 4px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.overlay-label {
  font-size: 12px;
  color: #64748b;
}

.overlay-input {
  width: 90px;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.intraday-chart {
  flex: 1;
  width: 100%;
}

.detail-table {
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}

/* 增强滚动条 */
.panorama-scroll-area::-webkit-scrollbar {
  height: 10px;
}
.panorama-scroll-area::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 5px;
}
.plate-flow::-webkit-scrollbar {
  width: 0;
}
</style>
