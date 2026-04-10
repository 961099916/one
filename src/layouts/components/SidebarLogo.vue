<template>
  <div class="sidebar-logo" @click="handleClick">
    <div class="logo-icon">
      <n-icon size="24" color="var(--el-color-primary)">
        <library-outline />
      </n-icon>
    </div>
    <span v-show="!isCollapse" class="logo-text">One AI</span>
  </div>
</template>

<script setup lang="ts">
import { LibraryOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

function handleClick() {
  emit('toggle')
}
</script>

<style scoped>
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.5px;
  white-space: nowrap;
}
</style>
