<template>
  <n-layout has-sider class="layout-root">
    <!-- 侧边栏 -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="sidebarWidth"
      :collapsed="isCollapse"
      @collapse="isCollapse = true"
      @expand="isCollapse = false"
      class="sidebar-sider"
    >
      <Sidebar :is-collapse="isCollapse" @toggle="toggleCollapse" />
    </n-layout-sider>

    <!-- 主内容区 -->
    <n-layout class="main-layout">
      <n-layout-header bordered class="header-container">
        <AppHeader :is-dark="isDark" :app-version="appVersion" @theme-toggle="toggleTheme" />
      </n-layout-header>

      <n-layout-content class="content-container" :native-scrollbar="false">
        <AppMain />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent } from 'naive-ui'
import { Sidebar, AppHeader, AppMain } from './components'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

const appVersion = ref('—')
const isCollapse = computed({
  get: () => appStore.sidebarCollapsed,
  set: (val) => (appStore.sidebarCollapsed = val),
})

const sidebarWidth = computed(() => appStore.settings.sidebarWidth || 240)
const isDark = ref(false)

onMounted(async () => {
  if (window.electronAPI) {
    appVersion.value = await window.electronAPI.app.getVersion()
  }
  const savedTheme = document.documentElement.getAttribute('data-theme')
  isDark.value = savedTheme === 'dark'
})

function toggleCollapse() {
  appStore.toggleSidebar()
}

function toggleTheme() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
</script>

<style scoped>
.layout-root {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
  margin-top: 10px;
}

.sidebar-sider {
  background-color: var(--bg-sidebar);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-layout {
  background-color: var(--bg-app);
}

.header-container {
  height: 64px;
  padding: 0;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
}

.content-container {
  background-color: var(--bg-app);
  padding: 16px;
}
</style>
