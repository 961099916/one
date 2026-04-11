<template>
  <div class="limit-up-page">
    <StockPoolTable pool-name="limit_up" pool-title="涨停池" />
  </div>
</template>

<script setup lang="ts">
import StockPoolTable from '@/components/market/StockPoolTable.vue'
</script>

<style scoped>
.limit-up-page {
  padding: 16px;
  height: 100%;
}
</style>
