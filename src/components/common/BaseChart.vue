<template>
  <div ref="containerRef" class="base-chart-container">
    <v-chart
      class="chart-instance"
      :option="option"
      :autoresize="true"
      :theme="theme"
      :loading="loading"
      :loading-options="loadingOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores'
import VChart from 'vue-echarts'

interface Props {
  option: any
  loading?: boolean
}

const props = defineProps<Props>()

const appStore = useAppStore()
const containerRef = ref<HTMLElement | null>(null)

// 根据全局主题动态切换图表主题
const theme = computed(() => (appStore.currentTheme === 'dark' ? 'dark' : ''))

// 加载配置
const loadingOptions = computed(() => ({
  text: '加载中...',
  color: 'var(--primary-color)',
  textColor: 'var(--text-secondary)',
  maskColor: appStore.currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)',
  zlevel: 0
}))

</script>

<style scoped>
.base-chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.chart-instance {
  width: 100%;
  height: 100%;
}
</style>
