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

    <div class="table-wrapper" v-if="sentimentMatrix.length > 0">
      <table class="sentiment-table">
        <thead>
          <tr>
            <th class="sticky-col">日期</th>
            <th>两市成交额</th>
            <th>上证涨跌</th>
            <th>红/绿盘</th>
            <th>涨停数</th>
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
                <div v-for="sector in day.topSectors" :key="sector.name" class="sector-tag" :style="getSectorStyle(sector.count)">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NButton, NIcon, NInputNumber, NSpin, NEmpty, NSpace, useMessage, NAlert 
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useSentimentCycle } from '@/composables/useSentimentCycle'
import { useAppStore } from '@/stores'

const router = useRouter()
const message = useMessage()
const appStore = useAppStore()
const displayLimit = ref(25)
const { loading, sentimentMatrix, loadData } = useSentimentCycle()

const tdxPath = computed(() => appStore.settings.tdxPath)

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
    // 假设 1万亿以上算热
    ratio = Math.min(val / 1500000000000, 1)
    return { backgroundColor: `rgba(239, 68, 68, ${ratio * 0.4})`, color: ratio > 0.6 ? '#fff' : 'inherit' }
  }
  if (type === 'limitUp') {
    ratio = Math.min(val / 100, 1) // 100只涨停算疯狂
    return { backgroundColor: `rgba(239, 68, 68, ${ratio * 0.8})`, color: ratio > 0.4 ? '#fff' : 'inherit' }
  }
  if (type === 'broken') {
    ratio = Math.min(val, 0.5) // 50%炸板算地狱
    return { backgroundColor: `rgba(34, 197, 94, ${ratio * 1.5})`, color: ratio > 0.3 ? '#fff' : 'inherit' }
  }
  if (type === 'bigMeat') {
    ratio = Math.min(val / 50, 1) // 50只大肉算高潮
    return { backgroundColor: `rgba(239, 68, 68, ${ratio * 0.3})` }
  }
  if (type === 'bigFace') {
    ratio = Math.min(val / 50, 1) // 50只大面算极点
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
</style>
