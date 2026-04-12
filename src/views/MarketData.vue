<template>
  <div class="market-data-container">
    <div class="market-layout">
      <!-- 控制栏 -->
      <n-card :bordered="false" class="control-card">
        <div class="control-content">
          <div class="filter-section">
            <span class="label">日期筛选:</span>
            <n-date-picker
              v-model:value="filterRange"
              type="daterange"
              clearable
              :is-date-disabled="disableFutureDates"
              @update:value="handleFilterChange"
              size="medium"
            />
          </div>
          <div class="action-section">
            <n-button 
              type="success" 
              secondary 
              @click="$router.push(RoutePath.XUANGUBAO_LIMIT_UP)"
            >
              <template #icon>
                <n-icon :component="Analytics" />
              </template>
              涨停分析
            </n-button>
            <n-button type="primary" secondary @click="showSyncModal = true">
              <template #icon>
                <n-icon :component="Sync" />
              </template>
              强制同步
            </n-button>
            <n-button :loading="loading" @click="fetchData" quaternary circle title="刷新数据">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 图表区域 -->
      <n-card :bordered="false" class="chart-card">
        <template #header>
          <div class="header-content">
            <n-icon size="20" :component="BarChartOutline" />
            <span class="header-title">涨跌走势分时图</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <base-chart :option="chartOption" :loading="loading" />
        </div>
      </n-card>

      <!-- 表格区域 -->
      <n-card :bordered="false" class="main-card">
        <template #header>
          <div class="header-content">
            <n-icon size="20" :component="ListOutline" />
            <span class="header-title">分时数据明细</span>
          </div>
        </template>

        <n-data-table
          :loading="loading"
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          :bordered="false"
          size="small"
          class="market-table"
        />
      </n-card>
    </div>

    <!-- 强制同步模态框 -->
    <n-modal
      v-model:show="showSyncModal"
      preset="dialog"
      title="强制同步选股通数据"
      positive-text="开始同步"
      negative-text="取消"
      :loading="syncing"
      @positive-click="handleSync"
    >
      <div style="margin-top: 16px">
        <p style="margin-bottom: 8px; color: #666">请选择需要强制覆盖同步的日期范围：</p>
        <n-date-picker
          v-model:value="syncRange"
          type="daterange"
          clearable
          :is-date-disabled="disableFutureDates"
          style="width: 100%"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import BaseChart from '@/components/common/BaseChart.vue'
import { useAppStore } from '@/stores'
import {
  NCard,
  NDataTable,
  NButton,
  NIcon,
  NTag,
  NProgress,
  NDatePicker,
  NModal,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { BarChartOutline, RefreshOutline, Sync, ListOutline, Analytics } from '@vicons/ionicons5'
import { formatDate } from '@/utils/format'
import { RoutePath } from '@/constants'

interface MarketData {
  id: number
  date: string
  timestamp: number
  rise_count: number
  fall_count: number
  limit_up_count: number
  limit_down_count: number
  limit_up_broken_count: number
  limit_up_broken_ratio: number
  market_temperature: number
  created_at: number
}

// 状态定义
const marketData = ref<MarketData[]>([])
const loading = ref(false)
const syncing = ref(false)
const showSyncModal = ref(false)
const message = useMessage()

// 默认日期逻辑：当天
const today = new Date().setHours(0, 0, 0, 0)
const filterRange = ref<[number, number]>([today, today])
const syncRange = ref<[number, number]>([today, today])

const pagination = {
  pageSize: 20
}

const appStore = useAppStore()

// 禁止选择未来日期
const disableFutureDates = (ts: number) => {
  return ts > Date.now()
}

// 过滤表格数据（排除图表专用的断裂点 null）
const tableData = computed(() => {
  return marketData.value.filter((item): item is MarketData => item !== null)
})

// 图表配置
const chartOption = computed(() => {
  const isDark = appStore.currentTheme === 'dark'
  const displayData = marketData.value

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const item = params[0]
        const data = displayData[item.dataIndex]
        const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString('zh-CN', { hour12: false })
        let str = `<div style="font-weight: bold; margin-bottom: 4px">${data.date} ${timeStr}</div>`
        params.forEach((p: any) => {
          let value = p.value
          if (p.seriesName === '炸板' && data) {
            const ratio = (data.limit_up_broken_ratio * 100).toFixed(1)
            value = `${p.value} (${ratio}%)`
          }
          str += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
            <span>${p.marker} ${p.seriesName}</span>
            <span style="font-weight: bold">${value}</span>
          </div>`
        })
        return str
      }
    },
    legend: {
      data: ['上涨', '涨停', '炸板', '市场温度', '下跌', '跌停'],
      bottom: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b' }
    },
    grid: {
      left: '2%',
      right: '2%',
      top: '12%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: displayData.map(d => {
        if (!d) return ''
        const date = new Date(d.timestamp * 1000)
        const dayStr = d.date.split('-').slice(1).join('/')
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        return `${dayStr} ${timeStr}`
      }),
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { 
        color: isDark ? '#64748b' : '#94a3b8',
        interval: (index: number) => {
          if (index === 0) return true
          const current = displayData[index]
          const prev = displayData[index - 1]
          if (!current || !prev) return false
          // 只在日期变换或每隔 60 个点显示标签
          return current.date !== prev.date || index % 60 === 0
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '家数',
        position: 'left',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: { color: isDark ? '#64748b' : '#94a3b8' }
      },
      {
        type: 'value',
        name: '涨跌停',
        position: 'right',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: isDark ? '#64748b' : '#94a3b8' }
      }
    ],
    series: [
      {
        name: '上涨',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 0,
        connectNulls: false,
        data: displayData.map(d => d ? d.rise_count : null),
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 2 }
      },
      {
        name: '涨停',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 1,
        connectNulls: false,
        data: displayData.map(d => d ? d.limit_up_count : null),
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3, type: 'solid' },
        emphasis: { lineStyle: { width: 4 } }
      },
      {
        name: '炸板',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 1,
        connectNulls: false,
        data: displayData.map(d => d ? d.limit_up_broken_count : null),
        itemStyle: { color: '#f472b6' },
        lineStyle: { width: 2, type: 'dashed' },
        emphasis: { lineStyle: { width: 3 } }
      },
      {
        name: '市场温度',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 0, // 复用左轴（如果希望更明显，其实温度 0-100 在 0-5000 规模下很小，但为了趋势观察可以考虑放在右轴或独立轴）
        connectNulls: false,
        data: displayData.map(d => d ? d.market_temperature : null),
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 2, type: 'dotted' },
      },
      {
        name: '下跌',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 0,
        connectNulls: false,
        data: displayData.map(d => d ? d.fall_count : null),
        itemStyle: { color: '#22c55e' },
        lineStyle: { width: 2 }
      },
      {
        name: '跌停',
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: 1,
        connectNulls: false,
        data: displayData.map(d => d ? d.limit_down_count : null),
        itemStyle: { color: '#15803d' },
        lineStyle: { width: 3, type: 'solid' },
        emphasis: { lineStyle: { width: 4 } }
      }
    ]
  }
})

const columns: DataTableColumns<MarketData> = [
  {
    title: '日期',
    key: 'date',
    width: 100,
  },
  {
    title: '时间',
    key: 'timestamp',
    width: 100,
    render(row) {
      if (!row) return ''
      return new Date(row.timestamp * 1000).toLocaleTimeString('zh-CN', { hour12: false })
    }
  },
  {
    title: '上涨',
    key: 'rise_count',
    width: 70,
    render(row) {
      return h(NTag, { type: 'error', bordered: false, size: 'small' }, { default: () => row.rise_count })
    }
  },
  {
    title: '涨停',
    key: 'limit_up_count',
    width: 70,
    render(row) {
      if (!row) return ''
      return h(NTag, { color: { color: '#fee2e2', textColor: '#dc2626' }, bordered: false, size: 'small' }, { default: () => row.limit_up_count })
    }
  },
  {
    title: '炸板(率)',
    key: 'limit_up_broken_count',
    width: 100,
    render(row) {
      if (!row) return ''
      const ratio = (row.limit_up_broken_ratio * 100).toFixed(1)
      return h('div', { style: 'display: flex; flex-direction: column; align-items: center; gap: 2px' }, [
        h(NTag, { color: { color: '#fdf2f8', textColor: '#db2777' }, bordered: false, size: 'small' }, { default: () => row.limit_up_broken_count }),
        h('span', { style: 'font-size: 10px; color: #94a3b8' }, `${ratio}%`)
      ])
    }
  },
  {
    title: '温度',
    key: 'market_temperature',
    width: 70,
    render(row) {
      if (!row) return ''
      return h('span', { style: 'font-weight: bold; color: #f59e0b; display: flex; justify-content: center' }, row.market_temperature.toFixed(1))
    }
  },
  {
    title: '下跌',
    key: 'fall_count',
    width: 70,
    render(row) {
      if (!row) return ''
      return h(NTag, { type: 'success', bordered: false, size: 'small' }, { default: () => row.fall_count })
    }
  },
  {
    title: '跌停',
    key: 'limit_down_count',
    width: 70,
    render(row) {
      return h(NTag, { color: { color: '#dcfce7', textColor: '#16a34a' }, bordered: false, size: 'small' }, { default: () => row.limit_down_count })
    }
  },
  {
    title: '强度',
    key: 'ratio',
    render(row) {
      if (!row) return ''
      const total = row.rise_count + row.fall_count
      const percentage = total > 0 ? (row.rise_count / total) * 100 : 50
      return h('div', { class: 'ratio-container' }, [
        h(NProgress, {
          type: 'line',
          percentage: percentage,
          showIndicator: false,
          color: '#f87171',
          railColor: '#4ade80',
          height: 8,
        })
      ])
    }
  }
]

// 接口调用逻辑
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterRange.value) {
      const [startTs, endTs] = filterRange.value
      params.startDate = formatDate(startTs)
      params.endDate = formatDate(endTs)
    }
    
    const api = (window as any).electronAPI
    if (api?.db?.getMarketData) {
      const rawData: MarketData[] = await api.db.getMarketData(params)
      
      // 处理跨天断裂逻辑
      const processed: (MarketData | null)[] = []
      rawData.forEach((item, index) => {
        if (index > 0 && item.date !== rawData[index - 1].date) {
          // 插入 null 作为断裂点
          processed.push(null)
        }
        processed.push(item)
      })
      
      marketData.value = processed as any
    }
  } catch (err) {
    console.error('Fetch error:', err)
    message.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  fetchData()
}

const handleSync = async () => {
  if (!syncRange.value) return
  syncing.value = true
  try {
    const [startTs, endTs] = syncRange.value
    const startDate = formatDate(startTs)
    const endDate = formatDate(endTs)
    
    const api = (window as any).electronAPI
    if (api?.db?.syncMarketData) {
      const result = await api.db.syncMarketData({ startDate, endDate, force: true })
      if (result.success) {
        message.success(`成功同步 ${result.count} 个分时采样点`)
        showSyncModal.value = false
        fetchData()
      }
    }
  } catch (err) {
    console.error('Sync error:', err)
    message.error('强制同步失败')
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
      const latestTs = new Date(latestDay.date.replace(/-/g, '/')).getTime()
      filterRange.value = [latestTs, latestTs]
      syncRange.value = [latestTs, latestTs]
    }
  } catch (err) {
    console.error('Failed to get latest trading day in MarketData:', err)
  }
  fetchData()
})
</script>

<style scoped>
.market-data-container {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
}

.market-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.control-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.control-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-weight: 500;
  color: #64748b;
}

.action-section {
  display: flex;
  gap: 8px;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-wrapper {
  height: 300px;
  width: 100%;
}

.main-card {
  flex: 1;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.ratio-container {
  width: 100%;
  padding: 4px 0;
}

:deep(.n-data-table-td) {
  vertical-align: middle;
}
</style>
