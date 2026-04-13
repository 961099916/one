<template>
  <div class="sentiment-cycle-container">
    <div class="header">
      <div class="title-section">
        <h2 class="main-title">情绪周期分析矩阵</h2>
        <div class="subtitle">两市成交热力 · 全市场大肉大面监测 · 连板梯队动能</div>
      </div>
      <div class="actions">
        <n-space align="center" :size="24">
          <div v-if="!tdxPath" class="path-warning">
            <n-alert title="未配置通达信路径" type="warning" size="small" :show-icon="false">
              无法加载成交额等指标。 <n-button text type="warning" @click="goToSettings">前往设置</n-button>
            </n-alert>
          </div>
          <div class="limit-setting">
            <span class="label">展示深度:</span>
            <n-input-number v-model:value="displayLimit" size="small" :min="10" :max="60" :step="5" style="width: 90px" @update:value="loadData(displayLimit)" />
          </div>
          <n-button secondary type="info" :loading="loading" @click="loadData(displayLimit)">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            同步最新数据
          </n-button>
        </n-space>
      </div>
    </div>

    <div v-if="sentimentMatrix.length > 0" class="chart-wrapper">
      <BaseChart :option="chartOption" :loading="loading" />
    </div>

    <div class="table-wrapper" v-if="sentimentMatrix.length > 0">
      <table class="sentiment-table">
        <thead>
          <tr>
            <th class="sticky-col">日期</th>
            <th>两市成交额</th>
            <th>上证涨跌</th>
            <th>红/绿盘</th>
            <th>涨停数</th>
            <th>跌停数</th>
            <th>炸板率</th>
            <th class="divider"></th>
            <th class="meat-face">大肉(10%+)</th>
            <th class="meat-face">大面(-10%+)</th>
            <th>昨停收益</th>
            <th class="divider"></th>
            <th>1连板</th>
            <th>2连板</th>
            <th>3连板</th>
            <th>4连板</th>
            <th>5+连板</th>
            <th>最高板</th>
            <th>次高板</th>
            <th class="divider"></th>
            <th>跌停最低板</th>
            <th>次跌停最低板</th>
            <th class="divider"></th>
            <th>1→2 晋级</th>
            <th>2→3 晋级</th>
            <th>3+ 晋级</th>
            <th class="divider"></th>
            <th class="sector-col">核心题材板块</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in sentimentMatrix" :key="day.date" :class="{ 'is-today': isToday(day.date) }">
            <!-- 日期 -->
            <td class="sticky-col date-cell">
              {{ day.date.substring(5) }}
              <div v-if="isToday(day.date)" class="today-tag">今日</div>
            </td>

            <!-- 两市成交额 (TDX 修正万元单位) -->
            <td :style="getHeatmapStyle(day.turnover, 'turnover')">
              {{ formatAmount(day.turnover) }}
            </td>

            <!-- 大盘涨跌 (以上证指数为准) -->
            <td :class="getPriceColor(day.indexChange || 0)">
              {{ (day.indexChange! * 100).toFixed(2) }}%
            </td>

            <!-- 红绿盘 -->
            <td class="counts-cell">
              <span class="up">{{ day.riseCount }}</span>
              <span class="sep">/</span>
              <span class="down">{{ day.fallCount }}</span>
            </td>

            <!-- 涨停数 -->
            <td :style="getHeatmapStyle(day.limitUpCount, 'limitUp')">
              {{ day.limitUpCount }}
            </td>

            <!-- 跌停数 -->
            <td :style="getHeatmapStyle(day.limitDownCount, 'limitDown')">
              {{ day.limitDownCount }}
            </td>

            <!-- 炸板率 -->
            <td :style="getHeatmapStyle(day.brokenRatio, 'broken')">
              {{ (day.brokenRatio * 100).toFixed(1) }}%
            </td>

            <td class="divider"></td>

            <!-- 大肉/大面 (全市场扫描结果) -->
            <td class="meat-cell" :style="getHeatmapStyle(day.bigMeat, 'bigMeat')">
              {{ day.bigMeat || 0 }}
            </td>
            <td class="face-cell" :style="getHeatmapStyle(day.bigFace, 'bigFace')">
              {{ day.bigFace || 0 }}
            </td>

            <!-- 昨日涨停今日平均收益 -->
            <td :class="getPriceColor(day.profitAvg || 0)" class="profit-cell">
              {{ day.profitAvg !== undefined ? (day.profitAvg * 100).toFixed(2) + '%' : '-' }}
            </td>

            <td class="divider"></td>

            <!-- 连板梯队 (1-5+) -->
            <td v-for="b in [1, 2, 3, 4]" :key="b" :style="getLadderStyle(day.ladder[b], b)">
              {{ day.ladder[b] || 0 }}
            </td>
            <td :style="getLadderStyle(getHighBoardCount(day.ladder), 5)">
              {{ getHighBoardCount(day.ladder) }}
            </td>

            <!-- 最高板 -->
            <td class="high-board-cell">
              {{ day.maxBoard || '-' }}
            </td>

            <!-- 次高板 -->
            <td class="high-board-cell">
              {{ day.secondMaxBoard || '-' }}
            </td>

            <td class="divider"></td>

            <!-- 跌停最低板 -->
            <td class="down-board-cell">
              {{ day.minDownBoard !== undefined && day.minDownBoard !== null ? day.minDownBoard : '-' }}
            </td>

            <!-- 次跌停最低板 -->
            <td class="down-board-cell">
              {{ day.secondMinDownBoard !== undefined && day.secondMinDownBoard !== null ? day.secondMinDownBoard : '-' }}
            </td>

            <td class="divider"></td>

            <!-- 晋级率 (1->2, 2->3, 3+) -->
            <td class="promotion-cell">
              <div class="progress-bg" v-if="day.promotionRates[1] !== undefined">
                <div class="progress-bar" :style="{ width: (day.promotionRates[1] * 100) + '%', backgroundColor: getPromotionColor(day.promotionRates[1]) }"></div>
                <span class="label">{{ (day.promotionRates[1] * 100).toFixed(0) }}%</span>
              </div>
              <span v-else>-</span>
            </td>
            <td class="promotion-cell">
              <div class="progress-bg" v-if="day.promotionRates[2] !== undefined">
                <div class="progress-bar" :style="{ width: (day.promotionRates[2] * 100) + '%', backgroundColor: getPromotionColor(day.promotionRates[2]) }"></div>
                <span class="label">{{ (day.promotionRates[2] * 100).toFixed(0) }}%</span>
              </div>
              <span v-else>-</span>
            </td>
            <td class="promotion-cell">
              <div class="progress-bg" v-if="getMaxPromotion(day.promotionRates) !== undefined">
                <div class="progress-bar" :style="{ width: (getMaxPromotion(day.promotionRates)! * 100) + '%', backgroundColor: getPromotionColor(getMaxPromotion(day.promotionRates)!) }"></div>
                <span class="label">{{ (getMaxPromotion(day.promotionRates)! * 100).toFixed(0) }}%</span>
              </div>
              <span v-else>-</span>
            </td>

            <td class="divider"></td>

            <!-- 题材板块 -->
            <td class="sector-cell">
              <div class="sector-tags">
                <div 
                  v-for="sector in day.topSectors" 
                  :key="sector.name" 
                  class="sector-tag" 
                  :style="getSectorStyle(sector.count)"
                  @click="openSectorDetail(sector, day.date)"
                >
                  <span class="name">{{ sector.name }}</span>
                  <span class="count">{{ sector.count }}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading && sentimentMatrix.length === 0" class="state-container">
      <n-spin size="large" />
      <div class="state-text">正在扫描全量历史行情以聚合精准深度指标...</div>
    </div>
    
    <n-empty v-else-if="sentimentMatrix.length === 0" class="state-container" description="暂无本地情绪数据，请确认已同步历史选股通数据并配置 TDX 路径">
      <template #extra>
        <n-button type="primary" @click="goToMarketData">前往同步数据</n-button>
      </template>
    </n-empty>

    <!-- 题材详情抽屉 -->
    <n-drawer v-model:show="showDrawer" :width="drawerWidth" placement="right">
      <div class="drawer-resizer" @mousedown="onResizerMouseDown"></div>
      <n-drawer-content closable>
        <template #header>
          <div class="drawer-header">
            <div class="header-title">
              <span class="plate-title">{{ activeSector?.name }}</span>
              <n-tag size="small" :bordered="false" type="info" round class="date-tag">{{ activeDate }}</n-tag>
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
                  @update:value="updateChart(activeStock)"
                />
              </div>
            </div>
            
            <div v-if="!tdxPath" class="chart-placeholder">
              <n-text depth="3">请先在设置中配置通达信路径以开启分时对比</n-text>
            </div>
            <v-chart 
              v-else-if="sectorChartOption" 
              class="intraday-chart" 
              :option="sectorChartOption" 
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

          <n-data-table
            size="small"
            :columns="sectorStockColumns"
            :data="sortedSectorStocks"
            :loading="sectorLoading"
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
import { useRouter } from 'vue-router'
import { 
  NButton, NIcon, NInputNumber, NSpin, NEmpty, NSpace, useMessage, NAlert,
  NDrawer, NDrawerContent, NTag, NDataTable, NText
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useSentimentCycle } from '@/composables/useSentimentCycle'
import { useAppStore } from '@/stores'
import { useStockActions } from '@/composables/useStockActions'
import { useSurgeMinuteChart } from '@/composables/useSurgeMinuteChart'
import BaseChart from '@/components/common/BaseChart.vue'
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
import type { SurgeStock } from '@common/types/market'

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
])

const router = useRouter()
const message = useMessage()
const appStore = useAppStore()
const displayLimit = ref(25)
const { loading, sentimentMatrix, loadData } = useSentimentCycle()
const { handleStockClick: openInPreferredApp } = useStockActions()

const tdxPath = computed(() => appStore.settings.tdxPath)

// 抽屉状态
const showDrawer = ref(false)
const activeSector = ref<{ name: string; count: number } | null>(null)
const activeDate = ref('')
const sectorStocks = ref<SurgeStock[]>([])
const sectorLoading = ref(false)
const drawerWidth = ref(800)
let isResizing = false
const overlayN = ref(0)

const sortedSectorStocks = computed(() => {
  if (!activeSector.value) return []
  return [...sectorStocks.value].sort((a, b) => {
    const getBoardCount = (row: SurgeStock) => {
      return row.parsedRawData?.limit_up_days || 0
    }
    if (a.is_limit_up !== b.is_limit_up) return b.is_limit_up - a.is_limit_up
    if (a.is_limit_up) {
      const countA = getBoardCount(a)
      const countB = getBoardCount(b)
      if (countB !== countA) return countB - countA
    }
    return (b.change_percent || 0) - (a.change_percent || 0)
  })
})

const { chartOption: sectorChartOption, chartLoading, activeStock, updateChart } = useSurgeMinuteChart(tdxPath, activeDate, overlayN, sortedSectorStocks)

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

const openSectorDetail = async (sector: { name: string; count: number }, date: string) => {
  activeSector.value = sector
  activeDate.value = date
  showDrawer.value = true
  
  sectorLoading.value = true
  try {
    const stocks = await window.electronAPI.db.getStockPool({ poolName: 'limit_up', date })
    sectorStocks.value = stocks.filter(s => 
      (s.reason_info || '').includes(sector.name)
    ).map(s => ({
      ...s,
      parsedRawData: JSON.parse(s.raw_data || '{}'),
      is_limit_up: true
    }))
    
    if (sectorStocks.value.length > 0) {
      const list = [...sectorStocks.value].sort((a, b) => b.is_limit_up - a.is_limit_up)
      updateChart(list[0])
    } else {
      updateChart(null)
    }
  } catch (err) {
    console.error('Failed to fetch sector stocks:', err)
    sectorStocks.value = []
    updateChart(null)
  } finally {
    sectorLoading.value = false
  }
}

const handleStockClick = (row: SurgeStock) => {
  openInPreferredApp(row.symbol)
}

const rowProps = (row: SurgeStock) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('stock-clickable')) return
      updateChart(row)
    }
  }
}

const sectorStockColumns = [
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
    render(row: SurgeStock) {
      const count = row.parsedRawData?.limit_up_days || row.board_count || 1
      return h(NTag, { type: 'error', size: 'tiny', bordered: false, round: true }, { default: () => `${count}板` })
    }
  },
  {
    title: '涨跌幅',
    key: 'change_percent',
    width: 80,
    render(row: SurgeStock) {
      let val = row.change_percent || 0
      const color = val > 0 ? '#ef4444' : val < 0 ? '#22c55e' : 'inherit'
      if (Math.abs(val) < 100) {
        val = val * 100
      }
      return h('span', { style: { color, fontWeight: 'bold' } }, 
        `${val > 0 ? '+' : ''}${val.toFixed(2)}%`
      )
    }
  },
  {
    title: '涨停原因',
    key: 'reason',
    render(row: SurgeStock) {
      const reason = row.parsedRawData?.surge_reason?.stock_reason || row.reason_info || '-'
      return h(NText, { depth: 3, style: 'font-size: 12px' }, { default: () => reason })
    }
  }
]

const latestTradingDate = ref('')

onMounted(async () => {
  try {
    const latestDay = await window.electronAPI.db.getLatestTradingDay()
    if (latestDay) {
      latestTradingDate.value = latestDay.date
    }
  } catch (e) {
    console.error('Failed to get latest trading day:', e)
  }
  loadData(displayLimit.value)
})

const goToSettings = () => router.push('/settings')

const isToday = (date: string) => {
  if (latestTradingDate.value) return date === latestTradingDate.value
  return date === new Date().toISOString().split('T')[0]
}

const formatAmount = (val?: number) => {
  if (!val) return '-'
  const bil = val / 100000000
  return bil > 10000 ? (bil / 10000).toFixed(2) + '万亿' : bil.toFixed(0) + '亿'
}

const getPriceColor = (val: number) => {
  if (val > 0) return 'text-red'
  if (val < 0) return 'text-green'
  return ''
}

const getHeatmapStyle = (val: number | undefined, type: string) => {
  if (val === undefined) return {}
  let ratio = 0
  if (type === 'turnover') {
    ratio = Math.min(val / 1500000000000, 1)
    return { backgroundColor: `rgba(239, 68, 68, ${ratio * 0.4})`, color: ratio > 0.6 ? '#fff' : 'inherit' }
  }
  if (type === 'limitUp') {
    ratio = Math.min(val / 100, 1)
    return { backgroundColor: `rgba(239, 68, 68, ${ratio * 0.8})`, color: ratio > 0.4 ? '#fff' : 'inherit' }
  }
  if (type === 'limitDown') {
    ratio = Math.min(val / 50, 1)
    return { backgroundColor: `rgba(34, 197, 94, ${ratio * 0.8})`, color: ratio > 0.4 ? '#fff' : 'inherit' }
  }
  if (type === 'broken') {
    ratio = Math.min(val, 0.5)
    return { backgroundColor: `rgba(34, 197, 94, ${ratio * 1.5})`, color: ratio > 0.3 ? '#fff' : 'inherit' }
  }
  if (type === 'bigMeat') {
    ratio = Math.min(val / 50, 1)
    return { backgroundColor: `rgba(239, 68, 68, ${ratio * 0.3})` }
  }
  if (type === 'bigFace') {
    ratio = Math.min(val / 50, 1)
    return { backgroundColor: `rgba(34, 197, 94, ${ratio * 0.3})` }
  }
  return {}
}

const getLadderStyle = (count: number | undefined, level: number) => {
  if (!count) return { color: '#94a3b8', opacity: 0.3 }
  const ratio = Math.min(count / (level === 1 ? 50 : level * 2), 1)
  const baseColor = level >= 3 ? '239, 68, 68' : '59, 130, 246'
  return {
    backgroundColor: `rgba(${baseColor}, ${0.1 + ratio * 0.8})`,
    color: ratio > 0.4 ? '#fff' : `rgb(${baseColor})`,
    fontWeight: '800'
  }
}

const getHighBoardCount = (ladder: Record<number, number>) => {
  return Object.entries(ladder)
    .filter(([b]) => Number(b) >= 5)
    .reduce((sum, [, count]) => sum + count, 0)
}

const getPromotionColor = (rate: number) => {
  if (rate > 0.5) return '#ef4444'
  if (rate > 0.3) return '#f59e0b'
  return '#3b82f6'
}

const getMaxPromotion = (rates: Record<number, number>) => {
  const keys = Object.keys(rates).map(Number).filter(k => k >= 3)
  if (keys.length === 0) return undefined
  return Math.max(...keys.map(k => rates[k]))
}

const getSectorStyle = (count: number) => {
  const intensity = Math.min(count / 10, 1)
  return {
    backgroundColor: `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`,
    borderColor: `rgba(239, 68, 68, ${intensity * 0.5})`
  }
}

const goToMarketData = () => router.push('/market/data')

const chartOption = computed(() => {
  const dates = sentimentMatrix.value.map(d => d.date.substring(5))
  const maxBoardData = sentimentMatrix.value.map(d => d.maxBoard || 0)
  const secondMaxBoardData = sentimentMatrix.value.map(d => d.secondMaxBoard || 0)
  const limitUpData = sentimentMatrix.value.map(d => d.limitUpCount || 0)
  const limitDownData = sentimentMatrix.value.map(d => d.limitDownCount || 0)
  const minDownBoardData = sentimentMatrix.value.map(d => d.minDownBoard || 0)
  const secondMinDownBoardData = sentimentMatrix.value.map(d => d.secondMinDownBoard || 0)

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['最高板', '次高板', '跌停最低板', '跌停次低板', '涨停数', '跌停数'],
      top: 10,
      textStyle: {
        color: '#666'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      axisLabel: {
        color: '#666',
        rotate: 45,
        fontSize: 12
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '连板数',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#1890ff'
          }
        },
        axisLabel: {
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      {
        type: 'value',
        name: '涨跌停数',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#52c41a'
          }
        },
        axisLabel: {
          color: '#666'
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '最高板',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 0,
        itemStyle: {
          color: '#ef4444',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#ef4444',
          width: 3
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
            ]
          }
        },
        data: maxBoardData
      },
      {
        name: '次高板',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 0,
        itemStyle: {
          color: '#f59e0b',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#f59e0b',
          width: 3,
          type: 'dashed'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
            ]
          }
        },
        data: secondMaxBoardData
      },
      {
        name: '涨停数',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 1,
        itemStyle: {
          color: '#1890ff',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#1890ff',
          width: 2
        },
        data: limitUpData
      },
      {
        name: '跌停最低板',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 0,
        itemStyle: {
          color: '#52c41a',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#52c41a',
          width: 2
        },
        data: minDownBoardData
      },
      {
        name: '跌停次低板',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 0,
        itemStyle: {
          color: '#16a34a',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#16a34a',
          width: 2,
          type: 'dashed'
        },
        data: secondMinDownBoardData
      },
      {
        name: '跌停数',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 1,
        itemStyle: {
          color: '#52c41a',
          borderWidth: 2,
          borderColor: '#fff'
        },
        lineStyle: {
          color: '#52c41a',
          width: 2,
          type: 'dashed'
        },
        data: limitDownData
      }
    ]
  }
})
</script>

<style scoped>
.sentiment-cycle-container {
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 8px;
}

.main-title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: #0f172a;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.path-warning {
  max-width: 300px;
}

/* 图表样式 */
.chart-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  padding: 16px;
  margin-bottom: 20px;
  height: 320px;
}

/* 表格样式 */
.table-wrapper {
  flex: 1;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: auto;
  border: 1px solid var(--border-color);
}

.sentiment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: center;
}

.sentiment-table thead th {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  padding: 14px 8px;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  z-index: 10;
  white-space: nowrap;
  font-size: 12px;
}

.sentiment-table td {
  padding: 10px 6px;
  border-bottom: 1px solid var(--border-color-light);
  white-space: nowrap;
}

.sentiment-table tr:hover {
  background-color: #f8fafc;
}

/* 特殊列 */
.sticky-col {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 5;
  border-right: 2px solid #f1f5f9;
}

.date-cell {
  font-weight: 900;
  color: #1e293b;
}

.divider {
  width: 4px;
  padding: 0 !important;
  background: #f1f5f9;
}

.meat-cell { color: #ef4444; font-weight: bold; }
.face-cell { color: #22c55e; font-weight: bold; }
.profit-cell { font-weight: 900; }

.high-board-cell {
  font-weight: 900;
  font-size: 16px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.down-board-cell {
  font-weight: 900;
  font-size: 16px;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 6px;
}

.text-red { color: #ef4444; font-weight: bold; }
.text-green { color: #22c55e; font-weight: bold; }

.counts-cell .up { color: #ef4444; font-weight: bold; }
.counts-cell .down { color: #22c55e; font-weight: bold; }
.counts-cell .sep { margin: 0 4px; color: #cbd5e1; }

.promotion-cell { width: 80px; }
.progress-bg {
  height: 20px;
  background: #f1f5f9;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
}
.progress-bg .label {
  position: relative;
  z-index: 1;
  font-size: 10px;
  font-weight: 900;
  color: #334155;
}

.sector-col { text-align: left !important; padding-left: 16px !important; }
.sector-cell { text-align: left; padding-left: 16px; }
.sector-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sector-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.sector-tag .name { font-weight: 800; font-size: 12px; }
.sector-tag .count {
  font-size: 10px;
  background: rgba(239, 68, 68, 0.1);
  padding: 0 4px;
  border-radius: 4px;
}

.state-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #fff;
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

.drawer-body {
  padding-top: 16px;
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

.stock-clickable {
  cursor: pointer;
  color: var(--primary-color);
  text-decoration: underline;
}

.stock-clickable:hover {
  color: #1d4ed8;
}

.sector-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.sector-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}
</style>
