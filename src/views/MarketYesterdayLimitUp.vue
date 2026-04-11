<template>
  <div class="yesterday-limit-up-page">
    <StockPoolTable pool-name="yesterday_limit_up" pool-title="昨日涨停池" />
  </div>
</template>

<script setup lang="ts">
import StockPoolTable from '@/components/market/StockPoolTable.vue'
</script>

<style scoped>
.yesterday-limit-up-page {
  padding: 16px;
  height: 100%;
}
</style>
