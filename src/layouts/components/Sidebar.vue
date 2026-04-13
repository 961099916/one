<template>
  <div class="sidebar-content glass-effect">
    <div class="sidebar-header" :class="{ 'is-darwin': isDarwin, 'is-collapsed': isCollapse }">
      <SidebarLogo :is-collapse="isCollapse" @toggle="handleToggle" />
    </div>

    <SidebarMenu :is-collapse="isCollapse" />

    <SidebarFooter :is-collapse="isCollapse" @toggle="handleToggle" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidebarLogo from './SidebarLogo.vue'
import SidebarMenu from './SidebarMenu.vue'
import SidebarFooter from './SidebarFooter.vue'

defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const isDarwin = ref(false)

onMounted(async () => {
  const env = await window.electronAPI.app.getEnvInfo()
  isDarwin.value = env.platform === 'darwin'
})

function handleToggle() {
  emit('toggle')
}
</script>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-sidebar, rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
  transition: padding var(--transition-base);
}

.sidebar-header.is-darwin {
  padding-left: 80px; /* 为 macOS 交通灯留出空间 */
}

/* 当折叠时，在 macOS 上也需要一些顶部偏移或特殊处理，但通常 hiddenInset 在 64px 高度下表现良好 */
.sidebar-header.is-darwin.is-collapsed {
  padding-left: 16px;
  justify-content: center;
}

:deep(.sidebar-menu) {
  flex: 1;
}
</style>
