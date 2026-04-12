<template>
  <div class="sidebar-logo" @click="handleClick">
    <div class="logo-icon">
      <n-icon size="24" color="var(--el-color-primary)">
        <library-outline />
      </n-icon>
    </div>
    <span v-show="!isCollapse" class="logo-text">壹复盘</span>
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
  transition: opacity var(--transition-base);
}

.sidebar-logo:hover {
  opacity: 0.8;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f5222d, #165dff);
  border-radius: 6px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.2);
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0px;
  white-space: nowrap;
}
</style>
