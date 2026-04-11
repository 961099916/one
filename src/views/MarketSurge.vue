<template>
  <div class="market-surge">
    <!-- 顶部状态栏 -->
    <n-card :bordered="false" class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2 class="title">每日热点专题</h2>
          <div class="subtitle-group">
            <span class="subtitle">深度挖掘市场热点题材与板块领涨个股</span>
            <n-tag v-if="lastUpdateTime" size="small" :bordered="false" type="info" class="time-tag">
              数据快照: {{ formatTime(lastUpdateTime) }}
            </n-tag>
          </div>
        </div>
        <div class="action-section">
          <n-date-picker
            v-model:value="selectedTimestamp"
            type="date"
            @update:value="handleDateChange"
            :is-date-disabled="disableDate"
            placeholder="选择交易日"
            style="width: 140px"
          />
          <n-button 
            type="primary" 
            @click="loadData"
            :loading="loading"
          >
            <template #icon>
              <n-icon><SearchOutline /></n-icon>
            </template>
            查询
          </n-button>
          <n-button 
            type="info" 
            ghost 
            :loading="syncing"
            @click="syncData"
          >
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            同步云端
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 主体布局 -->
    <div class="main-layout">
      <!-- 左侧板块列表 -->
      <div class="sider">
        <n-card title="今日题材" size="small" :bordered="false">
          <n-empty v-if="plates.length === 0" description="暂无板块数据" style="padding: 40px 0" />
          <n-list hoverable clickable v-else>
            <n-list-item 
              v-for="plate in plates" 
              :key="plate.plate_id"
              :class="{ 'is-active': selectedPlateId === plate.plate_id }"
              @click="selectedPlateId = plate.plate_id"
            >
              <div class="plate-item">
                <div class="plate-name">{{ plate.name }}</div>
                <div class="plate-desc">{{ plate.description }}</div>
              </div>
            </n-list-item>
          </n-list>
        </n-card>
      </div>

      <!-- 右侧个股详情 -->
      <div class="content">
        <n-card :title="currentPlateName" size="small" :bordered="false">
          <n-data-table
            :columns="columns"
            :data="filteredStocks"
            :loading="loading"
            :max-height="'calc(100vh - 280px)'"
            virtual-scroll
            size="small"
          />
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useMessage, NTag, NText } from 'naive-ui'
import { SyncOutline, SearchOutline } from '@vicons/ionicons5'
import type { SurgePlateRow, SurgeStockRow } from '../../electron/infrastructure/database/types'

const message = useMessage()
const selectedTimestamp = ref(Date.now())
const plates = ref<SurgePlateRow[]>([])
const stocks = ref<SurgeStockRow[]>([])
const selectedPlateId = ref<number | null>(null)
const lastUpdateTime = ref<number | null>(null)
const loading = ref(false)
const syncing = ref(false)

const selectedDate = computed(() => {
  const d = new Date(selectedTimestamp.value)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
})

const currentPlateName = computed(() => {
  if (!selectedPlateId.value) return '请选择板块'
  const plate = plates.value.find(p => p.plate_id === selectedPlateId.value)
  return plate ? `题材内个股：${plate.name}` : '未知板块'
})

const filteredStocks = computed(() => {
  if (!selectedPlateId.value) return []
  return stocks.value.filter(s => {
    const ids = JSON.parse(s.plate_ids || '[]')
    return ids.includes(selectedPlateId.value)
  })
})

const columns = [
  {
    title: '股票',
    key: 'stock_name',
    width: 140,
    render(row: SurgeStockRow) {
      return h('div', { style: 'display: flex; flex-direction: column' }, [
        h(NText, { strong: true, style: 'font-size: 14px' }, { default: () => row.stock_name }),
        h(NText, { depth: 3, style: 'font-size: 12px' }, { default: () => row.symbol })
      ])
    }
  },
  {
    title: '最新价',
    key: 'price',
    width: 100,
    render(row: SurgeStockRow) {
      return h('span', { style: 'font-family: tabular-nums' }, row.price?.toFixed(2))
    }
  },
  {
    title: '涨跌幅',
    key: 'change_percent',
    width: 100,
    render(row: SurgeStockRow) {
      const color = (row.change_percent || 0) > 0 ? '#ff4d4f' : (row.change_percent || 0) < 0 ? '#52c41a' : 'inherit'
      return h('span', { style: { color, fontWeight: 'bold' } }, 
        `${(row.change_percent || 0) > 0 ? '+' : ''}${(row.change_percent! * 100).toFixed(2)}%`
      )
    }
  },
  {
    title: '领涨原因',
    key: 'description',
    render(row: SurgeStockRow) {
      return h('div', { style: 'display: flex; align-items: flex-start; gap: 8px' }, [
        row.is_limit_up ? h(NTag, { type: 'error', size: 'small', bordered: false }, { default: () => '涨停' }) : null,
        h(NText, { depth: 2, style: 'font-size: 13px; line-height: 1.5' }, { default: () => row.description })
      ])
    }
  }
]

const loadData = async () => {
  loading.value = true
  try {
    const [p, s, ts] = await Promise.all([
      window.electronAPI.db.getSurgePlates(selectedDate.value),
      window.electronAPI.db.getSurgeStocks(selectedDate.value),
      window.electronAPI.db.getLatestSurgeTimestamp(selectedDate.value)
    ])
    plates.value = p
    stocks.value = s
    lastUpdateTime.value = ts
    
    if (p.length > 0 && !selectedPlateId.value) {
      selectedPlateId.value = p[0].plate_id
    } else if (p.length === 0) {
      selectedPlateId.value = null
    }
  } catch (err) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const syncData = async () => {
  syncing.value = true
  try {
    const res = await window.electronAPI.db.syncSurgeData(selectedDate.value)
    if (res.success) {
      message.success('同步成功')
      await loadData()
    } else {
      message.error('同步失败，请检查网络或稍后重试')
    }
  } catch (err) {
    message.error('同步过程中发生错误')
  } finally {
    syncing.value = false
  }
}

const handleDateChange = () => {
  plates.value = []
  stocks.value = []
  selectedPlateId.value = null
  lastUpdateTime.value = null
}

const formatTime = (ts: number) => {
  const date = new Date(ts * 1000)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const disableDate = (ts: number) => {
  return ts > Date.now()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.market-surge {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f5f7f9;
}

.header-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 20px;
  background: linear-gradient(to right, #1a1a1a, #4a4a4a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #8c8c8c;
  font-size: 13px;
}

.subtitle-group {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-tag {
  font-family: tabular-nums;
  font-weight: 500;
}

.action-section {
  display: flex;
  gap: 12px;
}

.main-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.sider {
  width: 320px;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  min-width: 0;
}

.plate-item {
  padding: 8px 4px;
  cursor: pointer;
}

.plate-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}

.plate-desc {
  font-size: 12px;
  color: #595959;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.is-active {
  background-color: #e6f7ff !important;
  border-left: 4px solid #1890ff;
}

:deep(.n-card) {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:deep(.n-list-item) {
  transition: all 0.3s ease;
}

:deep(.n-list-item:hover) {
  background-color: #fafafa;
}
</style>
