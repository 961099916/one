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
  // 处理嵌套路由的激活状态
  const path = route.path
  if (path === '/') return '/'

  // 查匹配的顶级或二级菜单路径
  const findActiveKey = (items: MenuItem[]): string | undefined => {
    for (const item of items) {
      if (item.path === path) return item.path
      if (item.children) {
        // 子路由路径拼接：父路径/子路径
        const childMatch = item.children.find(c => {
          const fullPath = item.path.endsWith('/') ? item.path + c.path : `${item.path}/${c.path}`
          return path === fullPath || path.startsWith(fullPath + '/')
        })
        if (childMatch) return item.path.endsWith('/') ? item.path + childMatch.path : `${item.path}/${childMatch.path}`
      }
    }
    return undefined
  }

  return findActiveKey(menuRoutes.value) || path
})

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function mapMenuRoutesToOptions(routes: MenuItem[]): MenuOption[] {
  return routes.map((item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0

    const option: MenuOption = {
      label: hasChildren
        ? item.title
        : () => h(RouterLink, { to: item.path } as any, { default: () => item.title }),
      key: item.path,
      icon: item.icon ? renderIcon(item.icon) : undefined,
    }

    if (hasChildren && item.children) {
      option.children = item.children.map(child => ({
        label: () => h(RouterLink, { to: `${item.path}/${child.path}` } as any, { default: () => child.title }),
        key: `${item.path}/${child.path}`,
        icon: child.icon ? renderIcon(child.icon) : undefined,
      }))
    }

    return option
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
