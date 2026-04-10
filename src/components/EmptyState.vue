<template>
  <div class="empty-state">
    <div class="empty-icon">
      <n-icon size="64" color="var(--el-color-primary)">
        <chatbubbles-outline />
      </n-icon>
    </div>
    <h2 class="empty-text">有什么我可以帮助您的吗？</h2>
    <div class="empty-suggestions">
      <button
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="suggestion-btn"
        @click="$emit('suggestion-click', suggestion)"
      >
        <n-icon size="16">
          <sparkles-outline />
        </n-icon>
        {{ suggestion }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SparklesOutline, ChatbubblesOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

defineEmits<{
  'suggestion-click': [text: string]
}>()

const suggestions = [
  '你好，请自我介绍一下',
  '帮我写一封正式的职场邮件',
  '解释一下什么是量子纠缠',
]
</script>

<style scoped>
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 24px;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.empty-text {
  font-size: 20px;
  color: var(--el-text-color-primary);
  margin: 0 0 32px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.empty-suggestions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 640px;
}

.suggestion-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.suggestion-icon {
  font-size: 14px;
}

.suggestion-btn:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.suggestion-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .empty-text {
    font-size: 18px;
  }
  
  .suggestion-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
