<template>
  <div class="limit-down-page">
    <StockPoolTable pool-name="limit_down" pool-title="跌停池" />
  </div>
</template>

<script setup lang="ts">
import StockPoolTable from '@/components/market/StockPoolTable.vue'
</script>

<style scoped>
.limit-down-page {
  padding: 16px;
  height: 100%;
}
</style>
