<template>
  <div class="market-data-container">
    <div class="market-layout">
      <!-- 图表区域 -->
      <n-card :bordered="false" class="chart-card">
        <template #header>
          <div class="header-content">
            <n-icon size="20" :component="BarChartOutline" />
            <span class="header-title">涨跌家数趋势</span>
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
            <n-icon size="20" :component="RefreshOutline" />
            <span class="header-title">数据明细</span>
          </div>
        </template>

        <template #header-extra>
          <div style="display: flex; gap: 8px; align-items: center;">
            <n-button 
              type="primary" 
              size="small" 
              :loading="syncing" 
              @click="handleSync"
              secondary
            >
              <template #icon>
                <n-icon :component="Sync" />
              </template>
              同步今日数据
            </n-button>
            <n-button :loading="loading" @click="fetchData" quaternary circle title="重载列表">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
            </n-button>
          </div>
        </template>

        <n-data-table
          :loading="loading"
          :columns="columns"
          :data="marketData"
          :pagination="pagination"
          :bordered="false"
          class="market-table"
        />
      </n-card>
    </div>
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
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { BarChartOutline, RefreshOutline, Sync } from '@vicons/ionicons5'

interface MarketData {
  id: number
  date: string
  rise_count: number
  fall_count: number
  created_at: number
}

const marketData = ref<MarketData[]>([])
const loading = ref(false)
const syncing = ref(false)
const message = useMessage()
const pagination = {
  pageSize: 10
}

const appStore = useAppStore()

// 图表配置
const chartOption = computed(() => {
  // 取最近 20 条数据并按日期正序排列用于展示趋势
  const displayData = [...marketData.value].reverse().slice(-20)
  const isDark = appStore.currentTheme === 'dark'

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
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
      data: displayData.map(d => d.date.slice(5)), // 只显示 月-日
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDark ? '#64748b' : '#94a3b8' }
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
    width: 120,
    render(row) {
      return h('span', { style: 'font-weight: 500' }, row.date)
    }
  },
  {
    title: '上涨家数',
    key: 'rise_count',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: 'error', bordered: false, size: 'small' },
        { default: () => `${row.rise_count}` }
      )
    }
  },
  {
    title: '下跌家数',
    key: 'fall_count',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: 'success', bordered: false, size: 'small' },
        { default: () => `${row.fall_count}` }
      )
    }
  },
  {
    title: '涨跌对比',
    key: 'ratio',
    render(row) {
      const total = row.rise_count + row.fall_count
      const percentage = total > 0 ? (row.rise_count / total) * 100 : 50
      
      return h('div', { class: 'ratio-container' }, [
        h(NProgress, {
          type: 'line',
          percentage: percentage,
          showIndicator: false,
          color: '#f87171', // Tailwind red-400
          railColor: '#4ade80', // Tailwind green-400
          status: 'error',
          height: 12,
          processing: false
        }),
        h('div', { class: 'ratio-text' }, [
          h('span', { class: 'rise-text' }, `${Math.round(percentage)}% 上涨`),
          h('span', { class: 'fall-text' }, `${100 - Math.round(percentage)}% 下跌`)
        ])
      ])
    }
  },
  {
    title: '采集时间',
    key: 'created_at',
    width: 180,
    render(row) {
      return new Date(row.created_at).toLocaleString()
    }
  }
]

async function fetchData() {
  loading.value = true
  try {
    const api = (window as any).electronAPI
    if (api?.db?.getMarketData) {
      marketData.value = await api.db.getMarketData()
    }
  } catch (err) {
    console.error('Failed to fetch market data:', err)
    message.error('加载市场数据失败')
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    const api = (window as any).electronAPI
    if (api?.db?.syncMarketData) {
      const result = await api.db.syncMarketData()
      if (result.success) {
        message.success('今日数据同步成功')
        await fetchData()
      } else {
        message.warning(result.message || '同步完成，但未获取到新数据')
      }
    }
  } catch (err) {
    console.error('Failed to sync market data:', err)
    message.error('同步失败')
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

.chart-card {
  height: 320px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-wrapper {
  height: 240px;
  width: 100%;
}

.main-card {
  flex: 1;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--n-title-text-color);
}

.market-table {
  margin-top: 8px;
}

.ratio-container {
  width: 100%;
  padding: 4px 0;
}

.ratio-text {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-top: 4px;
  color: #94a3b8;
}

.rise-text {
  color: #ef4444;
}

.fall-text {
  color: #22c55e;
}

:deep(.n-data-table-td) {
  vertical-align: middle;
}
</style>
