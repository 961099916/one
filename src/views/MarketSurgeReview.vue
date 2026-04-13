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
import { ref, onMounted, computed, h, nextTick } from 'vue'
import { 
  useMessage, NTag, NText, NCard, NButton, 
  NDataTable, NEmpty, NIcon, NDrawer, NDrawerContent,
  NBadge, NCheckbox, NSpin
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { normalizeStockSymbol } from '@common/utils/stockCode'
import { marketApi } from '@/api'
import type { SurgeStock, PlateDetail } from '@common/types/market'
import { useAppStore } from '@/stores'
import { useStockActions } from '@/composables/useStockActions'
import { useSurgeDragScroll } from '@/composables/useSurgeDragScroll'

const { handleStockClick: openInPreferredApp } = useStockActions()
const { panoramaRef, isDraggingTimeline, getDragHasMoved, onTimelineMouseDown } = useSurgeDragScroll()
import { useSurgeMinuteChart } from '@/composables/useSurgeMinuteChart'
import { useSurgeTimeline } from '@/composables/useSurgeTimeline'
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

const showDrawer = ref(false)
const activePlate = ref<PlateDetail | null>(null)
const activeDate = ref('')
const hideST = ref(true)

const { loading, timelineData, loadTimeline, syncTodayData } = useSurgeTimeline()

const drawerWidth = ref(800)
let isResizing = false
const overlayN = ref(0)

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


const openDetail = (plate: PlateDetail, date: string) => {
  if (getDragHasMoved()) return
  
  activePlate.value = plate
  activeDate.value = date
  showDrawer.value = true
  
  if (plate.stocks.length > 0) {
    const list = [...plate.stocks].sort((a, b) => b.is_limit_up - a.is_limit_up)
    updateChart(list[0])
  } else {
    chartOption.value = null
  }
}

const rowProps = (row: SurgeStock) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('stock-click-link')) return
      updateChart(row)
    }
  }
}

const handleStockClick = (row: SurgeStock) => {
  openInPreferredApp(row.symbol)
}

const processedTimelineData = computed(() => {
  return timelineData.value.map(day => {
    const processedPlates = day.plates.map(plate => {
      let filteredStocks = plate.stocks
      if (hideST.value) {
        filteredStocks = filteredStocks.filter(s => !s.stock_name.includes('ST'))
      }
      
      const limitUpCount = filteredStocks.filter(s => s.is_limit_up).length
      return {
        ...plate,
        stockCount: filteredStocks.length,
        limitUpCount: limitUpCount,
        filteredStocks
      }
    })
    
    const sortedPlates = [...processedPlates].sort((a, b) => b.limitUpCount - a.limitUpCount || b.stockCount - a.stockCount)
    return { ...day, plates: sortedPlates }
  })
})

const sortedStocks = computed(() => {
  if (!activePlate.value) return []
  const currentDay = processedTimelineData.value.find(d => d.date === activeDate.value)
  const currentPlate = currentDay?.plates.find(p => p.plate_id === activePlate.value?.plate_id)
  if (!currentPlate) return []
  
  let list = [...(currentPlate.filteredStocks || [])]
  return list.sort((a, b) => {
    const getBoardCount = (row: SurgeStock) => {
      return row.parsedRawData.limit_up_days || 0
    }
    if (a.is_limit_up !== b.is_limit_up) return b.is_limit_up - a.is_limit_up
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
    render(row: SurgeStock) {
      return h('div', [
        h(
          NText, 
          { 
            strong: true, 
            class: 'stock-clickable stock-click-link',
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
    render(row: SurgeStock) {
      if (!row.is_limit_up) return null
      const count = row.parsedRawData.limit_up_days || 1
      return h(NTag, { type: 'error', size: 'tiny', bordered: false, round: true }, { default: () => `${count}板` })
    }
  },
  {
    title: '涨跌幅',
    key: 'change_percent',
    width: 80,
    render(row: SurgeStock) {
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
    render(row: SurgeStock) {
      const turnover = (row.parsedRawData.turnover_ratio || 0) * 100
      return h(NText, { depth: 3, style: 'font-size: 11px' }, { default: () => `${turnover.toFixed(2)}%` })
    }
  },
  {
    title: '市值',
    key: 'm_cap',
    width: 70,
    render(row: SurgeStock) {
      const mCap = (row.parsedRawData.total_capital || 0) / 100000000
      return h(NText, { depth: 3, style: 'font-size: 11px' }, { default: () => `${mCap.toFixed(1)}亿` })
    }
  },
  {
    title: '时点',
    key: 'enter_time',
    width: 70,
    render(row: SurgeStock) {
      if (!row.enter_time) return '-'
      const date = new Date(row.enter_time * 1000)
      return h(NText, { depth: 3, style: 'font-size: 11px' }, { default: () => date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
    }
  },
  {
    title: '涨停原因',
    key: 'reason',
    render(row: SurgeStock) {
      const reason = row.parsedRawData.surge_reason?.stock_reason || row.description || '-'
      return h(NText, { depth: 3, style: 'font-size: 12px' }, { default: () => reason })
    }
  }
]

const { chartOption, chartLoading, activeStock, updateChart } = useSurgeMinuteChart(tdxPath, activeDate, overlayN, sortedStocks)

// updateChart 逻辑已经放入 useSurgeMinuteChart

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
    const latestDay = await marketApi.getLatestTradingDay()
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
