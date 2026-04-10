<template>
  <div class="sidebar-footer">
    <button class="collapse-trigger" @click="handleToggle" :title="collapseTitle">
      <n-icon size="18">
        <chevron-forward-outline v-if="isCollapse" />
        <chevron-back-outline v-else />
      </n-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronForwardOutline, ChevronBackOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

interface Props {
  isCollapse: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const collapseTitle = computed(() => (props.isCollapse ? '展开侧边栏' : '收起侧边栏'))

function handleToggle() {
  emit('toggle')
}
</script>

<style scoped>
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: center;
}

.collapse-trigger {
  width: 100%;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-radius: var(--el-border-radius-base);
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-trigger:hover {
  background-color: var(--el-fill-color-light);
}
</style>
