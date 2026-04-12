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
        <n-space align="center">
          <n-radio-group v-model:value="viewMode" size="small" type="button">
            <n-radio-button value="month">月视图</n-radio-button>
            <n-radio-button value="year">年视图</n-radio-button>
          </n-radio-group>
          
          <div class="divider-v"></div>

          <n-button type="primary" size="small" ghost @click="fetchData">
            <template #icon><n-icon :component="RefreshOutline" /></template>
            刷新数据
          </n-button>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-icon :component="InformationCircleOutline" size="18" style="cursor: help" color="var(--text-tertiary)" />
            </template>
            标记为“休市”的日期将自动跳过数据同步。点击日期即可标记。
          </n-tooltip>
        </n-space>
      </template>

      <div class="calendar-wrapper">
        <!-- 传统的月视图 -->
        <n-calendar
          v-if="viewMode === 'month'"
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
                <n-tag size="tiny" type="primary" :bordered="false">交易</n-tag>
              </template>
              <template v-else-if="isKnownDay(year, month, date)">
                <n-tag size="tiny" type="error" :bordered="false">休市</n-tag>
              </template>
            </div>
          </div>
        </n-calendar>

        <!-- 全景年度视图 -->
        <div v-else class="year-view-grid">
          <div class="year-header">
            <n-button quaternary circle size="small" @click="changeYear(-1)">
              <template #icon><n-icon :component="ChevronBack" /></template>
            </n-button>
            <span class="year-text">{{ displayYear }}年</span>
            <n-button quaternary circle size="small" @click="changeYear(1)">
              <template #icon><n-icon :component="ChevronForward" /></template>
            </n-button>
          </div>
          
          <div class="months-container">
            <div v-for="m in 12" :key="m" class="month-item">
              <div class="month-title">{{ m }}月</div>
              <div class="mini-calendar">
                <div class="week-header">
                  <span v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</span>
                </div>
                <div class="days-grid">
                  <div 
                    v-for="(day, idx) in getMonthDays(displayYear, m)" 
                    :key="idx"
                    class="day-cell"
                    :class="[
                      day.isCurrentMonth ? 'current-month' : 'other-month',
                      day.isToday ? 'is-today' : '',
                      getDateStatusClass(displayYear, m, day.date)
                    ]"
                    @click="day.isCurrentMonth && handleDateClickByParts(displayYear, m, day.date)"
                  >
                    <span class="day-num">{{ day.date }}</span>
                    <div v-if="day.isCurrentMonth && isKnownDay(displayYear, m, day.date)" class="status-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  NRadioGroup,
  NRadioButton,
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
  CloudDownloadOutline,
  ChevronBack,
  ChevronForward
} from '@vicons/ionicons5'

interface TradingDay {
  date: string
  is_trading: number
  updated_at: number
}

const currentDate = ref(Date.now())
const viewMode = ref<'month' | 'year'>('month')
const displayYear = ref(new Date().getFullYear())
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

// 处理点击 - 通用
const toggleStatus = async (key: string, nextStatus: boolean) => {
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

const handleDateClick = async (ts: number) => {
  const dateObj = new Date(ts)
  const key = formatDateKey(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate())
  const currentStatus = tradingDaysMap.value.get(key)
  const nextStatus = currentStatus === undefined ? true : !currentStatus
  await toggleStatus(key, nextStatus)
}

const handleDateClickByParts = async (y: number, m: number, d: number) => {
  const key = formatDateKey(y, m, d)
  const currentStatus = tradingDaysMap.value.get(key)
  const nextStatus = currentStatus === undefined ? true : !currentStatus
  await toggleStatus(key, nextStatus)
}

// 辅助函数：生成月份日期矩阵
const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  
  const days = []
  const todayStr = new Date().toLocaleDateString('sv')
  
  // 上个月填充
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: daysInPrevMonth - i, isCurrentMonth: false })
  }
  
  // 本月
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = formatDateKey(year, month, i)
    days.push({ 
      date: i, 
      isCurrentMonth: true,
      isToday: dStr === todayStr
    })
  }
  
  // 下个月填充 (补齐到 42 格，确保高度一致)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: i, isCurrentMonth: false })
  }
  
  return days
}

const changeYear = (delta: number) => {
  displayYear.value += delta
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
  padding: 20px;
  height: auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--bg-app);
}

.main-card, .sync-card {
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
}

.divider-v {
  width: 1px;
  height: 16px;
  background-color: var(--border-color);
  margin: 0 4px;
}

.label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.sync-info {
  font-size: 13px;
  padding: 10px 14px;
  background: var(--primary-bg);
  border-left: 4px solid var(--primary-color);
  border-radius: 4px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-color);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

/* 年度视图样式 */
.year-view-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.year-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 0;
}

.year-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.months-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.month-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  transition: transform 0.2s;
}

.month-item:hover {
  border-color: var(--primary-color);
}

.month-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
  color: var(--primary-color);
}

.mini-calendar {
  font-size: 12px;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  font-weight: 600;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: default;
  position: relative;
  transition: all 0.2s;
}

.day-cell.current-month {
  cursor: pointer;
  color: var(--text-primary);
}

.day-cell.current-month:hover {
  background: var(--primary-bg);
  color: var(--primary-color);
}

.day-cell.other-month {
  color: var(--text-disabled);
  visibility: hidden; /* 为了整洁，隐藏跨月日期 */
}

.day-cell.is-today {
  border: 1px solid var(--primary-color);
  font-weight: 700;
}

.status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin-top: 2px;
}

/* 状态颜色对齐 Arco Design */
.status-trading { background-color: rgba(22, 93, 255, 0.08); }
.status-non-trading { background-color: rgba(245, 63, 63, 0.08); }

.status-trading .status-dot { background-color: var(--primary-color); }
.status-non-trading .status-dot { background-color: var(--danger-color); }

.day-num {
  z-index: 2;
}

/* 状态图例 */
.status-legend {
  display: flex;
  gap: 24px;
  padding: 12px 24px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.trading { background: var(--primary-color); }
.dot.non-trading { background: var(--danger-color); }
.dot.unknown { background: transparent; border: 1px solid var(--border-color-strong); }

:deep(.n-calendar-cell) {
  min-height: 80px;
}

:deep(.n-calendar-cell--current) {
  background-color: var(--primary-bg) !important;
  border: 1px solid var(--primary-color) !important;
}
</style>
