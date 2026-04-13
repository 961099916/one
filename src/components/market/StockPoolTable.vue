<template>
  <div class="stock-pool-table-component">
    <!-- 顶部控制栏 -->
    <n-card :bordered="false" class="control-card">
      <div class="control-content">
        <div class="filter-section">
          <span class="label">日期筛选:</span>
          <n-date-picker
            v-model:value="selectedDateTs"
            type="date"
            :is-date-disabled="disableFutureDates"
            @update:value="handleDateChange"
            size="medium"
          />
          <n-tag :type="stockData.length > 0 ? 'success' : 'default'" round>
            今日项目: {{ stockData.length }} 家
          </n-tag>
          <n-tag v-if="maxBoards > 0" type="warning" round>
            最高连板: {{ maxBoards }}B
          </n-tag>
          <n-space align="center" style="margin-left: 12px">
            <span class="label-small">过滤ST:</span>
            <n-switch v-model:value="excludeST" size="small" />
          </n-space>
        </div>
        <div class="action-section">
          <n-button type="primary" secondary @click="handleSync" :loading="syncing">
            <template #icon>
              <n-icon :component="Sync" />
            </template>
            同步{{ poolTitle }}
          </n-button>
          <n-button :loading="loading" @click="fetchData" quaternary circle title="刷新">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 数据内容区 (题材合并展示模式) -->
    <div class="content-scroll-area">
      <n-card :bordered="false" class="table-card">
        <template #header>
          <div class="header-content">
            <n-icon size="20" :component="Analytics" />
            <span class="header-title">{{ poolTitle }}分析看板</span>
            <span class="header-subtitle">{{ selectedDateStr }}</span>
          </div>
        </template>
        
        <n-data-table
          remote
          :loading="loading"
          :columns="columns"
          :data="mergedTableData"
          :bordered="true"
          size="small"
          :scroll-x="1900"
          :max-height="'calc(100vh - 280px)'"
          class="merged-table"
          :row-key="(row) => `${row.symbol}-${row.displayPlate}`"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, watch } from 'vue'
import {
  NCard,
  NDataTable,
  NButton,
  NIcon,
  NTag,
  NDatePicker,
  NSpace,
  NSwitch,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { RefreshOutline, Sync, Analytics, Flame } from '@vicons/ionicons5'
import { formatDate } from '@/utils/format'
import { useStockActions } from '@/composables/useStockActions'

const { handleStockClick } = useStockActions()

interface StockPoolRow {
  symbol: string
  stock_name: string
  reason_info: string
  latest_price: number
  change_percent: number
  buy_lock_ratio: number
  turnover_ratio: number
  non_restricted_cap: number
  total_cap: number
  first_limit_up_time: number
  last_limit_up_time: number
  break_count: number
  board_count: number
  raw_data?: string
}

interface DisplayRow extends StockPoolRow {
  displayPlate: string
  rowSpan?: number
}

const props = defineProps<{
  poolName: string
  poolTitle: string
}>()

// 状态定义
const stockData = ref<StockPoolRow[]>([])
const loading = ref(false)
const syncing = ref(false)
const excludeST = ref(true)
const message = useMessage()

// 默认日期逻辑
const today = new Date().setHours(0, 0, 0, 0)
const selectedDateTs = ref(today)
const selectedDateStr = computed(() => formatDate(selectedDateTs.value))

/**
 * 核心逻辑：数据打平、排序并计算 RowSpan
 */
const mergedTableData = computed(() => {
  if (stockData.value.length === 0) return []
  
  // 先进行 ST 过滤
  const filteredStocks = excludeST.value 
    ? stockData.value.filter(s => !s.stock_name.includes('ST'))
    : stockData.value

  const flattened: DisplayRow[] = []
  
  // 1. 个股按题材打平
  filteredStocks.forEach(stock => {
    let plates: string[] = []
    if (stock.raw_data) {
      try {
        const raw = JSON.parse(stock.raw_data)
        plates = raw.surge_reason?.related_plates?.map((p: any) => p.plate_name) || []
      } catch (e) { /* ignore */ }
    }
    
    if (plates.length === 0) {
      const match = stock.reason_info.match(/\[(.*?)\]/)
      if (match && match[1]) {
        plates = match[1].split(', ')
      }
    }
    
    if (plates.length === 0) plates = ['其他']
    
    plates.forEach(p => {
      flattened.push({ ...stock, displayPlate: p })
    })
  })

  // 2. 计算题材强度用于题材间排序
  const plateStrengthMap = new Map<string, number>()
  flattened.forEach(row => {
    const current = plateStrengthMap.get(row.displayPlate) || 0
    const score = Math.max(current, row.board_count * 100 + filteredStocks.filter(s => s.symbol === row.symbol).length)
    plateStrengthMap.set(row.displayPlate, score)
  })

  // 3. 排序逻辑：题材强度 DESC -> 题材名称 ASC -> 连板数 DESC -> 涨停时间 ASC
  flattened.sort((a, b) => {
    const sA = plateStrengthMap.get(a.displayPlate) || 0
    const sB = plateStrengthMap.get(b.displayPlate) || 0
    if (sA !== sB) return sB - sA
    if (a.displayPlate !== b.displayPlate) return a.displayPlate.localeCompare(b.displayPlate)
    
    if (b.board_count !== a.board_count) {
      return b.board_count - a.board_count
    }
    return (a.first_limit_up_time || 0) - (b.first_limit_up_time || 0)
  })

  // 4. 计算 rowSpan
  const result: DisplayRow[] = []
  for (let i = 0; i < flattened.length; i++) {
    const row = flattened[i]
    if (i === 0 || flattened[i - 1].displayPlate !== row.displayPlate) {
      let count = 0
      for (let j = i; j < flattened.length; j++) {
        if (flattened[j].displayPlate === row.displayPlate) count++
        else break
      }
      result.push({ ...row, rowSpan: count })
    } else {
      result.push({ ...row, rowSpan: 0 })
    }
  }

  return result
})

// 统计
const maxBoards = computed(() => {
  if (stockData.value.length === 0) return 0
  return Math.max(...stockData.value.map(s => s.board_count))
})

const disableFutureDates = (ts: number) => ts > Date.now()

const formatMoney = (val: number) => {
  if (val >= 100000000) return (val / 100000000).toFixed(2) + '亿'
  if (val >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toString()
}

const formatTime = (ts: number) => {
  if (!ts) return '--'
  const date = new Date(ts * 1000)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const columns: DataTableColumns<DisplayRow> = [
  {
    title: '题材关键词',
    key: 'displayPlate',
    width: 140,
    fixed: 'left',
    align: 'center',
    className: 'plate-column',
    rowSpan: (row) => row.rowSpan || 1,
    render: (row) => h('div', { 
      style: 'font-weight: bold; color: #334155; font-size: 14px;'
    }, row.displayPlate)
  },
  {
    title: '股票名称',
    key: 'stock_name',
    width: 120,
    fixed: 'left',
    render: (row) => h('div', { 
      class: 'stock-clickable',
      onClick: () => handleStockClick(row.symbol)
    }, row.stock_name)
  },
  {
    title: '连板',
    key: 'board_count',
    width: 80,
    align: 'center',
    render: (row) => {
      const isHigh = row.board_count >= 3
      const isLimitDown = props.poolName === 'limit_down'
      
      // 涨停色系：橘红；跌停色系：绿色
      let colorConfig = isHigh 
        ? { color: '#f59e0b', textColor: '#fff' } 
        : { color: '#fee2e2', textColor: '#ef4444' }
      
      if (isLimitDown) {
        colorConfig = isHigh
          ? { color: '#059669', textColor: '#fff' }
          : { color: '#dcfce7', textColor: '#16a34a' }
      }

      return h(NTag, { 
        size: 'medium', 
        color: colorConfig,
        bordered: false,
        style: isHigh ? `font-weight: bold; box-shadow: 0 0 8px ${isLimitDown ? 'rgba(5, 150, 105, 0.4)' : 'rgba(245, 158, 11, 0.4)'}` : ''
      }, { 
        default: () => `${row.board_count}${isLimitDown ? 'D' : 'B'}`,
        icon: isHigh ? () => h(NIcon, { component: Flame }) : undefined
      })
    }
  },
  {
    title: '理由分析',
    key: 'reason_info',
    width: 350,
    render: (row) => {
      const parts = row.reason_info.split(' [')
      return h('div', { class: 'reason-text' }, parts[0])
    }
  },
  {
    title: '最新价',
    key: 'latest_price',
    width: 90,
    align: 'right',
    render: (row) => {
      const color = row.change_percent > 0 ? '#ef4444' : row.change_percent < 0 ? '#18a058' : '#334155'
      return h('span', { style: { color, fontWeight: '500' } }, row.latest_price.toFixed(2))
    }
  },
  {
    title: '涨跌幅',
    key: 'change_percent',
    width: 90,
    align: 'right',
    render: (row) => {
      const color = row.change_percent > 0 ? '#ef4444' : row.change_percent < 0 ? '#18a058' : '#334155'
      const prefix = row.change_percent > 0 ? '+' : ''
      return h('span', { style: { color } }, `${prefix}${(row.change_percent * 100).toFixed(2)}%`)
    }
  },
  {
    title: '封单比/炸板',
    key: 'buy_lock_ratio',
    width: 100,
    align: 'right',
    render: (row) => {
      if (props.poolName === 'limit_up_broken') {
        return formatTime(row.last_limit_up_time) // 提示炸板时间或者是最后封板时间
      }
      return h('span', { style: 'color: #f59e0b' }, `${(row.buy_lock_ratio * 100).toFixed(2)}%`)
    }
  },
  {
    title: '换手率',
    key: 'turnover_ratio',
    width: 90,
    align: 'right',
    render: (row) => `${(row.turnover_ratio * 100).toFixed(2)}%`
  },
  {
    title: '流通市值',
    key: 'non_restricted_cap',
    width: 110,
    align: 'right',
    render: (row) => formatMoney(row.non_restricted_cap)
  },
  {
    title: '首次封板',
    key: 'first_limit_up_time',
    width: 100,
    align: 'center',
    render: (row) => formatTime(row.first_limit_up_time)
  },
  {
    title: '炸板/最后',
    key: 'last_limit_up_time',
    width: 100,
    align: 'center',
    render: (row) => formatTime(row.last_limit_up_time)
  },
  {
    title: '开板',
    key: 'break_count',
    width: 70,
    align: 'center',
    render: (row) => h(NTag, { 
      size: 'small', 
      type: row.break_count > 0 ? 'warning' : 'default',
      bordered: false
    }, { default: () => row.break_count })
  }
]

const fetchData = async () => {
  loading.value = true
  try {
    const api = (window as any).electronAPI
    if (api?.db?.getStockPool) {
      const data = await api.db.getStockPool({ 
        poolName: props.poolName, 
        date: selectedDateStr.value 
      })
      stockData.value = data
    }
  } catch (err) {
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleDateChange = () => {
  fetchData()
}

// 监听分类切换
watch(() => props.poolName, () => {
  fetchData()
})

const handleSync = async () => {
  syncing.value = true
  try {
    const api = (window as any).electronAPI
    if (api?.db?.syncStockPool) {
      const result = await api.db.syncStockPool({ 
        poolName: props.poolName, 
        date: selectedDateStr.value 
      })
      if (result.success) {
        message.success('数据同步成功')
        fetchData()
      } else {
        message.error('同步未返回数据，今日可能是休市')
      }
    }
  } catch (err) {
    message.error('同步异常')
  } finally {
    syncing.value = false
  }
}


onMounted(async () => {
  loading.value = true
  try {
    const latestDay = await (window as any).electronAPI.db.getLatestTradingDay()
    if (latestDay && latestDay.date) {
      // 避免时区偏移：使用 '/' 替换 '-' 让 Date 按本地时间解析 YYYY/MM/DD
      selectedDateTs.value = new Date(latestDay.date.replace(/-/g, '/')).getTime()
    }
  } catch (err) {
    console.error('Failed to get latest trading day in StockPoolTable:', err)
  }
  fetchData()
})
</script>

<style scoped>
.stock-pool-table-component {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.control-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.label {
  font-weight: 600;
  color: #475569;
}

.label-small {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.action-section {
  display: flex;
  gap: 12px;
}

.content-scroll-area {
  flex: 1;
  overflow-y: auto;
}

.content-scroll-area::-webkit-scrollbar {
  width: 6px;
}
.content-scroll-area::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-left: 8px;
}

.reason-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.4;
  white-space: normal;
  word-break: break-all;
}

:deep(.merged-table .n-data-table-td) {
  padding: 12px 8px;
}

:deep(.merged-table .plate-column) {
  background-color: #f8fafc !important;
  border-right: 1px solid #e2e8f0 !important;
}

:deep(.n-data-table-th) {
  background-color: #f1f5f9 !important;
  font-weight: 700 !important;
  color: #475569 !important;
}

:deep(.n-data-table .n-data-table-wrapper) {
  border-radius: 8px;
}
</style>
