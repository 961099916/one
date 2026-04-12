<template>
  <div class="sidebar-content glass-effect">
    <div class="sidebar-header">
      <SidebarLogo :is-collapse="isCollapse" @toggle="handleToggle" />
    </div>

    <SidebarMenu :is-collapse="isCollapse" />

    <SidebarFooter :is-collapse="isCollapse" @toggle="handleToggle" />
  </div>
</template>

<script setup lang="ts">
import SidebarLogo from './SidebarLogo.vue'
import SidebarMenu from './SidebarMenu.vue'
import SidebarFooter from './SidebarFooter.vue'

defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

function handleToggle() {
  emit('toggle')
}
</script>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
}

:deep(.sidebar-menu) {
  flex: 1;
}
</style>
