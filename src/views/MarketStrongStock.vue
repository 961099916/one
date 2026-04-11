<template>
  <div class="strong-stock-page">
    <StockPoolTable pool-name="super_stock" pool-title="强势股" />
  </div>
</template>

<script setup lang="ts">
import StockPoolTable from '@/components/market/StockPoolTable.vue'
</script>

<style scoped>
.strong-stock-page {
  padding: 16px;
  height: 100%;
}
</style>
