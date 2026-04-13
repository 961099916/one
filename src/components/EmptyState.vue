<template>
  <div class="empty-state">
    <div class="brand-section">
      <div class="brand-logo-minimal">
        <n-icon size="48"><sparkles /></n-icon>
      </div>
      <h1 class="welcome-title">有什么我可以帮您的吗？</h1>
      <p class="welcome-desc">我是您的 A 股短线复盘助手，可以帮您分析连板天梯、龙虎榜与板块异动。</p>
    </div>

    <div class="suggestion-grid">
      <div
        v-for="(item, index) in suggestionCards"
        :key="index"
        class="suggestion-card"
        @click="$emit('suggestion-click', item.prompt)"
      >
        <div class="card-icon" :style="{ background: item.color + '15', color: item.color }">
          <n-icon size="20">
            <component :is="item.icon" />
          </n-icon>
        </div>
        <div class="card-content">
          <div class="card-title">{{ item.title }}</div>
          <div class="card-desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Sparkles, 
  TrendingUpOutline, 
  BarChartOutline, 
  FlashOutline, 
  ShieldCheckmarkOutline 
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

defineEmits<{
  'suggestion-click': [text: string]
}>()

const suggestionCards = [
  {
    title: '今日连板复盘',
    desc: '分析今日涨停板分布与连板高度',
    prompt: '帮我复盘一下今天的连板天梯，重点关注超过5连板的股票。',
    icon: TrendingUpOutline,
    color: '#165dff'
  },
  {
    title: '热门板块分析',
    desc: '洞察今日资金流向与领涨龙头',
    prompt: '总结一下今日热门板块的资金流向和核心龙头股。',
    icon: FlashOutline,
    color: '#ff7d00'
  },
  {
    title: '龙虎榜解读',
    desc: '透视游资与机构的博弈动向',
    prompt: '分析一下今天龙虎榜上有哪些值得关注的游资或机构动作。',
    icon: BarChartOutline,
    color: '#00b42a'
  },
  {
    title: '个股诊断',
    desc: '多维度分析技术面与股性特征',
    prompt: '帮我诊断一下[宁德时代]的技术形态和支撑压力位。',
    icon: ShieldCheckmarkOutline,
    color: '#722ed1'
  }
]
</script>

<style scoped>
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 80px;
  max-width: 800px;
  margin: 0 auto;
}

.brand-section {
  text-align: center;
  margin-bottom: 56px;
  animation: fadeInDown 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-24px); }
  to { opacity: 1; transform: translateY(0); }
}

.brand-logo-minimal {
  width: 80px;
  height: 80px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 16px;
  letter-spacing: -0.8px;
}

.welcome-desc {
  font-size: 15px;
  color: var(--el-text-color-regular);
  max-width: 520px;
  line-height: 1.6;
  margin: 0 auto;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
  animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.suggestion-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  text-align: left;
}

.suggestion-card:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .suggestion-grid {
    grid-template-columns: 1fr;
  }
  .welcome-title {
    font-size: 26px;
  }
}
</style>
