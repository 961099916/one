<template>
  <div class="limit-up-broken-page">
    <StockPoolTable pool-name="limit_up_broken" pool-title="炸板池" />
  </div>
</template>

<script setup lang="ts">
import StockPoolTable from '@/components/market/StockPoolTable.vue'
</script>

<style scoped>
.limit-up-broken-page {
  padding: 16px;
  height: 100%;
}
</style>
