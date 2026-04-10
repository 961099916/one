<template>
  <n-layout class="settings-root" :native-scrollbar="false">
    <n-layout-content class="settings-wrapper">
      <!-- 页面标题 -->
      <div class="settings-header">
        <h2 class="page-title">{{ currentPageTitle }}</h2>
        <p class="page-desc">{{ currentPageDesc }}</p>
      </div>

      <!-- 内容卡片 -->
      <div class="settings-component">
        <router-view />
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NLayout, NLayoutContent } from 'naive-ui'
import { getSettingsMenuRoutes } from '@/router/menu'
import { RoutePath } from '@/constants'

const route = useRoute()

const settingsMenuRoutes = computed(() => getSettingsMenuRoutes())

const currentPageTitle = computed(() => {
  const item = settingsMenuRoutes.value.find((i) =>
    isActive(`${RoutePath.SETTINGS}/${i.path}`)
  )
  return item?.title || '设置'
})

const currentPageDesc = computed(() => {
  const title = currentPageTitle.value
  if (title === '模型管理') return '配置和管理本地 LLM 模型'
  if (title === '通用设置') return '应用程序通用配置'
  if (title === '关于') return '关于应用程序的信息'
  return ''
})

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.settings-root {
  height: 100%;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.settings-wrapper {
  padding: 40px 64px;
  background-color: var(--bg-primary);
}

.settings-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.settings-component {
  max-width: 800px;
}
</style>
