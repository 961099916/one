<template>
  <div class="trading-calendar-container">
    <n-card :bordered="false" class="main-card">
      <template #header>
        <div class="header-content">
          <n-icon size="20" :component="CalendarOutline" />
          <span class="header-title">A股交易日历管理</span>
        </div>
      </template>

      <template #header-extra>
        <n-space>
          <n-button type="primary" size="small" ghost @click="fetchData">
            <template #icon><n-icon :component="RefreshOutline" /></template>
            刷新数据
          </n-button>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-icon :component="InformationCircleOutline" size="18" style="cursor: help" color="#94a3b8" />
            </template>
            点击日期即可切换该日是否为 A 股交易日。标记为“休市”的日期将自动跳过数据同步。
          </n-tooltip>
        </n-space>
      </template>

      <div class="calendar-wrapper">
        <n-calendar
          v-model:value="currentDate"
          #default="{ year, month, date }"
          @update:value="handleDateClick"
        >
          <div class="date-cell">
            <div 
              class="status-indicator" 
              :class="getDateStatusClass(year, month, date)"
            >
              <template v-if="getIsTrading(year, month, date)">
                <n-tag size="tiny" type="success" :bordered="false">交易</n-tag>
              </template>
              <template v-else-if="isKnownDay(year, month, date)">
                <n-tag size="tiny" type="error" :bordered="false">休市</n-tag>
              </template>
            </div>
          </div>
        </n-calendar>
      </div>
    </n-card>

    <!-- 一键同步卡片 -->
    <n-card :bordered="false" class="sync-card" title="一键同步选股通数据">
      <template #header-extra>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon :component="InformationCircleOutline" size="18" style="cursor: help" color="#94a3b8" />
          </template>
          同步选中区间内的所有市场指标和股票池（涨停、炸板等）数据。
        </n-tooltip>
      </template>
      
      <n-space vertical size="large">
        <n-space align="center">
          <span class="label">选择日期区间:</span>
          <n-date-picker 
            v-model:value="dateRange" 
            type="daterange" 
            clearable 
            :is-date-disabled="disableFutureDates"
            style="width: 300px"
          />
          <n-button 
            type="primary" 
            :loading="syncing" 
            :disabled="!dateRange" 
            @click="handleBatchSync"
          >
            <template #icon><n-icon :component="CloudDownloadOutline" /></template>
            开始同步
          </n-button>
        </n-space>
        
        <div v-if="syncing" class="sync-info">
          <n-text depth="3">正在同步数据，请稍候... 可能需要几十秒钟，取决于日期区间大小。</n-text>
        </div>
      </n-space>
    </n-card>

    <!-- 说明区域 -->
    <div class="status-legend">
      <div class="legend-item">
        <span class="dot trading"></span>
        <span>交易日 (开市)</span>
      </div>
      <div class="legend-item">
        <span class="dot non-trading"></span>
        <span>非交易日 (休市)</span>
      </div>
      <div class="legend-item">
        <span class="dot unknown"></span>
        <span>未同步/未知</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NCalendar,
  NTag,
  NIcon,
  NButton,
  NSpace,
  NTooltip,
  NDatePicker,
  NText,
  useMessage
} from 'naive-ui'
import {
  CalendarOutline,
  RefreshOutline,
  InformationCircleOutline,
  CloudDownloadOutline
} from '@vicons/ionicons5'

interface TradingDay {
  date: string
  is_trading: number
  updated_at: number
}

const currentDate = ref(Date.now())
const tradingDaysMap = ref<Map<string, boolean>>(new Map())
const message = useMessage()

// 格式化日期 key
const formatDateKey = (year: number, month: number, date: number): string => {
  const m = String(month).padStart(2, '0')
  const d = String(date).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// 获取状态
const isKnownDay = (year: number, month: number, date: number): boolean => {
  return tradingDaysMap.value.has(formatDateKey(year, month, date))
}

const getIsTrading = (year: number, month: number, date: number): boolean => {
  return tradingDaysMap.value.get(formatDateKey(year, month, date)) === true
}

const getDateStatusClass = (year: number, month: number, date: number): string => {
  const key = formatDateKey(year, month, date)
  if (!tradingDaysMap.value.has(key)) return 'status-unknown'
  return tradingDaysMap.value.get(key) ? 'status-trading' : 'status-non-trading'
}

// 获取数据
const fetchData = async () => {
  try {
    const api = (window as any).electronAPI
    if (api?.db?.getAllTradingDays) {
      const data: TradingDay[] = await api.db.getAllTradingDays()
      const newMap = new Map<string, boolean>()
      data.forEach(item => {
        newMap.set(item.date, item.is_trading === 1)
      })
      tradingDaysMap.value = newMap
    }
  } catch (err) {
    console.error('Fetch trading days failed:', err)
    message.error('加载交易日历数据失败')
  }
}

// 处理点击
const handleDateClick = async (ts: number) => {
  const dateObj = new Date(ts)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const date = dateObj.getDate()
  const key = formatDateKey(year, month, date)
  
  // 切换状态
  const currentStatus = tradingDaysMap.value.get(key)
  const nextStatus = currentStatus === undefined ? true : !currentStatus
  
  try {
    const api = (window as any).electronAPI
    if (api?.db?.updateTradingDay) {
      await api.db.updateTradingDay({ date: key, isTrading: nextStatus })
      tradingDaysMap.value.set(key, nextStatus)
      message.success(`${key} 已标记为 ${nextStatus ? '交易日' : '休市'}`)
    }
  } catch (err) {
    console.error('Update status failed:', err)
    message.error('更新交易状态失败')
  }
}

// 批量同步相关
const dateRange = ref<[number, number] | null>(null)
const syncing = ref(false)

const disableFutureDates = (ts: number) => {
  return ts > Date.now()
}

const handleBatchSync = async () => {
  if (!dateRange.value) return
  
  const [startTs, endTs] = dateRange.value
  const startDate = new Date(startTs).toLocaleDateString('sv')
  const endDate = new Date(endTs).toLocaleDateString('sv')
  
  syncing.value = true
  try {
    const api = (window as any).electronAPI
    if (api?.db?.batchSyncXuanguBao) {
      message.info(`开始同步 ${startDate} 至 ${endDate} 的数据...`)
      const result = await api.db.batchSyncXuanguBao({ startDate, endDate })
      
      if (result.success) {
        message.success(`完成数据同步！共处理 ${result.dateCount} 个潜在交易日，成功同步 ${result.syncCount} 天。`)
        if (result.errors && result.errors.length > 0) {
          console.warn('同步过程中出现部分错误:', result.errors)
        }
        await fetchData() // 刷新日历状态
      } else {
        message.error(result.message || '同步失败')
      }
    }
  } catch (err) {
    console.error('Batch sync failed:', err)
    message.error('批量同步过程中发生错误')
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.trading-calendar-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-card, .sync-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sync-card {
  margin-bottom: 16px;
}

.label {
  font-size: 14px;
  color: #64748b;
}

.sync-info {
  font-size: 13px;
  padding: 8px 12px;
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  border-radius: 4px;
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

.calendar-wrapper {
  margin-top: 8px;
}

/* 单元格样式 */
.date-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 4px;
}

.status-indicator {
  display: flex;
  justify-content: center;
  padding-bottom: 2px;
}

/* 状态图例 */
.status-legend {
  display: flex;
  gap: 24px;
  padding: 12px 24px;
  background: var(--n-card-color);
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.trading { background: #18a058; }
.dot.non-trading { background: #d03050; }
.dot.unknown { background: #e2e8f0; border: 1px solid #cbd5e1; }

:deep(.n-calendar-cell) {
  min-height: 80px;
}

:deep(.n-calendar-cell--current) {
  background-color: var(--n-button-color-hover) !important;
}

/* 针对不同状态的单元格背景微调(可选) */
:deep(.n-calendar-cell:hover) {
  cursor: pointer;
}
</style>
