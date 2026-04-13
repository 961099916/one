<template>
  <div class="stock-pool-page">
    <StockPoolTable :pool-name="resolvedPoolName" :pool-title="poolTitle" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StockPoolTable from '@/components/market/StockPoolTable.vue'

const props = defineProps<{
  poolName?: string
}>()

const route = useRoute()

// 从路由 props 或参数中提取股票池标识
const resolvedPoolName = computed(() => props.poolName || route.params.poolName as string)

// 从路由元数据中提取标题
const poolTitle = computed(() => (route.meta.title as string) ?? '股票池分析')
</script>

<style scoped>
.stock-pool-page {
  padding: 16px;
  height: 100%;
}
</style>
