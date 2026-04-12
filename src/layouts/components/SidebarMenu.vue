<template>
  <div class="sidebar-menu">
    <n-menu
      :collapsed="isCollapse"
      :collapsed-width="64"
      :collapsed-icon-size="20"
      :options="menuOptions"
      :value="activeKey"
      @update:value="handleMenuClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { NMenu, NIcon, type MenuOption } from 'naive-ui'
import { getMenuRoutes, type MenuItem } from '@/router/menu'

defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()

const menuRoutes = computed<MenuItem[]>(() => getMenuRoutes())

/** 映射菜单项为 Naive UI 格式 */
const menuOptions = computed<MenuOption[]>(() => {
  return mapMenuRoutesToOptions(menuRoutes.value)
})

/** 当前激活的菜单项 Key */
const activeKey = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  
  // 查找匹配的菜单项
  const match = menuRoutes.value.find(item => 
    path === item.path || path.startsWith(item.path + '/')
  )
  return match?.path || path
})

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function mapMenuRoutesToOptions(routes: MenuItem[]): MenuOption[] {
  return routes.map((item: MenuItem) => {
    return {
      label: () => h(RouterLink, { to: item.path } as any, { default: () => item.title }),
      key: item.path,
      icon: item.icon ? renderIcon(item.icon) : undefined,
    }
  })
}

function handleMenuClick() {
  // NMenu 的 RouterLink 会自动处理跳转，这里可以做额外逻辑
}
</script>

<style scoped>
.sidebar-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.n-menu .n-menu-item-content .n-menu-item-content-header) {
  font-weight: 500;
}

:deep(.n-menu.n-menu--collapsed .n-menu-item-content) {
  padding-left: 0 !important;
  justify-content: center;
}
</style>
