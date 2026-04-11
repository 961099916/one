<template>
  <div class="sentiment-cycle-page">
    <!-- 顶部状态栏 -->
    <div class="sentiment-header">
      <div class="header-left">
        <h2 class="title">情绪周期分析矩阵</h2>
        <n-text depth="3" class="subtitle">连板高度精细复盘 · 投机情绪体温计</n-text>
      </div>
      <div class="header-right">
        <n-space align="center">
          <n-text depth="3">展示天数:</n-text>
          <n-input-number v-model:value="displayLimit" size="small" :min="5" :max="40" style="width: 100px" @update:value="loadData(displayLimit)" />
          <n-button secondary type="info" :loading="loading" @click="loadData(displayLimit)">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新数据
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 核心矩阵区域 -->
    <div class="matrix-container" v-if="!loading || sentimentMatrix.length > 0">
      <div class="matrix-scroll-area">
        <div class="matrix-wrapper">
          <!-- 每一列代表一天 -->
          <div 
            v-for="day in sentimentMatrix" 
            :key="day.date" 
            class="day-column"
            :class="{ 'is-today': isToday(day.date) }"
          >
            <!-- 日期与核心指标 -->
            <div class="column-header">
              <div class="date-tag">{{ formatDate(day.date) }}</div>
              <div class="sentiment-stats">
                <div class="stat-item" :style="{ color: getTempColor(day.temperature) }">
                  <span class="label">温度:</span>
                  <span class="value">{{ day.temperature.toFixed(1) }}°</span>
                </div>
                <div class="stat-item">
                  <span class="label">涨跌:</span>
                  <span class="value">{{ (day.riseRatio * 100).toFixed(0) }}%</span>
                </div>
              </div>
              <div class="dragon-info">
                <span class="label">最高:</span>
                <span class="dragon-name">{{ day.dragonStock }}</span>
                <n-tag type="error" size="tiny" round>{{ day.maxBoard }}B</n-tag>
              </div>
            </div>

            <!-- 连板梯队矩阵 -->
            <div class="board-flow">
              <!-- 按高度从高到低排列 -->
              <div 
                v-for="bCount in getBoardCounts(day.matrix)" 
                :key="bCount" 
                class="board-section"
              >
                <div class="board-label" :class="{ 'high-board': bCount >= 3 }">
                  {{ bCount }}B
                  <n-badge :value="day.matrix[bCount].length" type="error" :show="day.matrix[bCount].length > 1" />
                </div>
                <div class="stock-list">
                  <div 
                    v-for="stock in day.matrix[bCount]" 
                    :key="stock.symbol" 
                    class="stock-bubble"
                    :style="getStockStyle(stock, bCount)"
                    @click="handleStockClick(stock)"
                  >
                    {{ stock.stock_name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载与空状态 -->
    <div v-if="loading && sentimentMatrix.length === 0" class="loading-state">
      <n-spin size="large" />
      <n-text depth="3">正在生成情绪分析矩阵...</n-text>
    </div>
    <n-empty v-else-if="sentimentMatrix.length === 0" description="暂无历史数据，请先同步选股通数据" class="empty-state">
      <template #extra>
        <n-button type="primary" @click="goToMarketData">去同步数据</n-button>
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NText, NButton, NIcon, NTag, NInputNumber, NSpin, NEmpty, NSpace, NBadge, useMessage
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useSentimentCycle } from '@/composables/useSentimentCycle'

const router = useRouter()
const message = useMessage()
const displayLimit = ref(20)
const { loading, sentimentMatrix, loadData } = useSentimentCycle()

const isToday = (date: string) => date === new Date().toLocaleDateString('sv')
const formatDate = (date: string) => date.split('-').slice(1).join('-')

const getBoardCounts = (matrix: Record<number, any[]>) => {
  return Object.keys(matrix).map(Number).sort((a, b) => b - a)
}

const getTempColor = (temp: number) => {
  if (temp > 80) return '#ef4444'
  if (temp > 50) return '#f59e0b'
  if (temp > 20) return '#3b82f6'
  return '#64748b'
}

const getStockStyle = (stock: any, bCount: number) => {
  const intensity = Math.min(bCount / 5, 1)
  return {
    backgroundColor: bCount >= 3 ? `rgba(239, 68, 68, ${0.1 + intensity * 0.9})` : '#fff',
    borderColor: bCount >= 3 ? '#ef4444' : '#e2e8f0',
    color: bCount >= 3 ? (intensity > 0.4 ? '#fff' : '#ef4444') : '#1e293b',
    fontWeight: bCount >= 2 ? 'bold' : 'normal'
  }
}

const handleStockClick = (stock: any) => {
  window.electronAPI.tdx.openStock(stock.symbol)
  message.success(`已唤起通达信: ${stock.stock_name}`)
}

const goToMarketData = () => {
  router.push('/market/data')
}

onMounted(() => loadData(displayLimit.value))
</script>

<style scoped>
.sentiment-cycle-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  padding: 24px;
  overflow: hidden;
}

.sentiment-header {
  padding: 0 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
}

/* 矩阵区域 */
.matrix-container {
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.matrix-scroll-area {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.matrix-wrapper {
  display: flex;
  height: 100%;
  padding: 20px 40px;
  min-width: fit-content;
}

.day-column {
  width: 180px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px dashed #e2e8f0;
  padding: 0 12px;
}

.day-column.is-today {
  background-color: #fffef0;
}

.column-header {
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #f1f5f9;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.date-tag {
  font-size: 16px;
  font-weight: 800;
  color: #334155;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
}

.sentiment-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.dragon-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.dragon-name {
  font-weight: 800;
  color: #ef4444;
}

/* 连板流 */
.board-flow {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

.board-flow::-webkit-scrollbar {
  width: 0; /* 隐藏滚动条但保留功能 */
}

.board-label {
  font-size: 12px;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.board-label.high-board {
  color: #ef4444;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stock-bubble {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-bubble:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
}

/* 状态 */
.loading-state, .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
</style>
