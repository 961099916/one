<template>
  <header class="app-header">
    <div class="header-left">
      <n-breadcrumb class="breadcrumb-container">
        <n-breadcrumb-item @click="router.push('/')">首页</n-breadcrumb-item>
        <n-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.title }}
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="header-right">
      <n-button quaternary circle :title="themeTitle" @click="handleThemeToggle">
        <template #icon>
          <n-icon size="20">
            <moon-outline v-if="!isDark" />
            <sunny-outline v-else />
          </n-icon>
        </template>
      </n-button>

      <div class="divider"></div>

      <n-tag :bordered="false" type="info" size="small" class="version-tag">
        v{{ appVersion }}
      </n-tag>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem, NIcon, NButton, NTag } from 'naive-ui'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'

interface Props {
  isDark: boolean
  appVersion: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'theme-toggle'): void
}>()

const route = useRoute()
const router = useRouter()

const themeTitle = computed(() => (props.isDark ? '切换浅色模式' : '切换深色模式'))

/** 动态计算面包屑层级 */
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title && item.path !== '/')
  return matched.map(item => ({
    title: item.meta.title as string,
    path: item.path
  }))
})

function handleThemeToggle() {
  emit('theme-toggle')
}
</script>

<style scoped>
.app-header {
  height: 64px;
  width: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  z-index: 10;
  -webkit-app-region: drag;
}

.header-left {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.breadcrumb-container :deep(.n-breadcrumb-item__link) {
  font-weight: 500;
  color: var(--text-secondary);
}

.breadcrumb-container :deep(.n-breadcrumb-item__link--active) {
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  -webkit-app-region: no-drag;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: var(--border-color);
}

.version-tag {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}
</style>
