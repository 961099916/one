<template>
  <span 
    class="stock-link" 
    @click="handleClick"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <slot />
    <span v-if="isHover" class="tooltip">点击在同花顺中打开</span>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { log } from '@/utils/logger'

interface Props {
  code: string
}

const props = defineProps<Props>()
const isHover = ref(false)

const handleClick = async () => {
  try {
    log.info('[StockLink] 点击股票代码:', props.code)
    if (window.ipcRenderer) {
      const result = await window.ipcRenderer.invoke('open-tonghuashun-stock', props.code)
      if (!result.success) {
        alert(result.error || '打开同花顺失败')
      }
    }
  } catch (err) {
    log.error('[StockLink] 打开失败:', err)
    alert('打开同花顺失败，请确保已安装同花顺软件')
  }
}
</script>

<style scoped>
.stock-link {
  position: relative;
  color: var(--primary-color, #4f46e5);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.stock-link:hover {
  color: var(--primary-hover, #4338ca);
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}
</style>
