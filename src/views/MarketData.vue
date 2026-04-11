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
          :data="marketData"
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
import { BarChartOutline, RefreshOutline, Sync, ListOutline } from '@vicons/ionicons5'
import { formatDate } from '@/utils/format'

interface MarketData {
  id: number
  date: string
  timestamp: number
  rise_count: number
  fall_count: number
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
          str += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
            <span>${p.marker} ${p.seriesName}</span>
            <span style="font-weight: bold">${p.value}</span>
          </div>`
        })
        return str
      }
    },
    legend: {
      data: ['上涨家数', '下跌家数'],
      bottom: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b' }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: displayData.map(d => {
        const date = new Date(d.timestamp * 1000)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }),
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDark ? '#64748b' : '#94a3b8', interval: 'auto' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#64748b' : '#94a3b8' }
    },
    series: [
      {
        name: '上涨家数',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: displayData.map(d => d.rise_count),
        itemStyle: { color: '#f87171' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(248, 113, 113, 0.2)' },
              { offset: 1, color: 'rgba(248, 113, 113, 0)' }
            ]
          }
        }
      },
      {
        name: '下跌家数',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: displayData.map(d => d.fall_count),
        itemStyle: { color: '#4ade80' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(74, 222, 128, 0.2)' },
              { offset: 1, color: 'rgba(74, 222, 128, 0)' }
            ]
          }
        }
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
      return new Date(row.timestamp * 1000).toLocaleTimeString('zh-CN', { hour12: false })
    }
  },
  {
    title: '上涨',
    key: 'rise_count',
    width: 80,
    render(row) {
      return h(NTag, { type: 'error', bordered: false, size: 'small' }, { default: () => row.rise_count })
    }
  },
  {
    title: '下跌',
    key: 'fall_count',
    width: 80,
    render(row) {
      return h(NTag, { type: 'success', bordered: false, size: 'small' }, { default: () => row.fall_count })
    }
  },
  {
    title: '强度',
    key: 'ratio',
    render(row) {
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
      marketData.value = await api.db.getMarketData(params)
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

onMounted(() => {
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
