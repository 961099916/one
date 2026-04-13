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
import { useAuthStore } from '@/stores'
import * as Icons from '@vicons/ionicons5'

defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()
const authStore = useAuthStore()

/** 图标组件库 */
const iconMap: Record<string, any> = Icons

/** 动态获取菜单数据 */
const menuRoutes = computed(() => authStore.menus)

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

function mapMenuRoutesToOptions(routes: any[]): MenuOption[] {
  return routes
    .filter(item => !item.hidden)
    .map((item: any) => {
      // 处理图标：如果是字符串则从库中找，如果是组件则直接用
      let iconComponent = item.icon
      if (typeof item.iconName === 'string' && iconMap[item.iconName]) {
        iconComponent = iconMap[item.iconName]
      }

      return {
        label: () => h(RouterLink, { to: item.path } as any, { default: () => item.title }),
        key: item.path,
        icon: iconComponent ? renderIcon(iconComponent) : undefined,
      }
    })
}

function handleMenuClick() {
  // NMenu 的 RouterLink 会自动处理跳转
}
</script>

<style scoped>
.sidebar-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.n-menu .n-menu-item-content) {
  height: 44px !important;
  margin: 4px 12px !important;
  border-radius: 10px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
}

:deep(.n-menu .n-menu-item-content:hover) {
  background-color: var(--bg-sidebar-hover, rgba(0, 0, 0, 0.05)) !important;
  transform: translateX(4px);
}

:deep(.n-menu .n-menu-item-content.n-menu-item-content--selected) {
  background-color: var(--bg-sidebar-active, rgba(var(--primary-color-rgb), 0.12)) !important;
  color: var(--primary-color) !important;
}

/* 激活态左侧指示条 */
:deep(.n-menu .n-menu-item-content.n-menu-item-content--selected::before) {
  content: "";
  position: absolute;
  left: -12px;
  top: 12px;
  bottom: 12px;
  width: 4px;
  background-color: var(--primary-color);
  border-radius: 0 4px 4px 0;
  transition: all 0.3s;
}

:deep(.n-menu .n-menu-item-content .n-menu-item-content-header) {
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.02em;
}

:deep(.n-menu.n-menu--collapsed .n-menu-item-content) {
  padding-left: 0 !important;
  justify-content: center;
  margin: 4px 8px !important;
}

:deep(.n-menu.n-menu--collapsed .n-menu-item-content:hover) {
  transform: scale(1.05);
}
</style>
