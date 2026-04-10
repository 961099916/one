/**
 * 菜单配置（从路由中分离，避免循环依赖）
 */
import type { Component } from 'vue'
import {
  HomeOutline,
  ChatboxOutline,
  SettingsOutline,
  CubeOutline,
  OptionsOutline,
  InformationCircleOutline,
  BarChartOutline,
} from '@vicons/ionicons5'
import { RoutePath } from '@/constants'

export interface MenuItem {
  path: string
  title: string
  icon?: Component
  hidden?: boolean
  order?: number
  children?: MenuItem[]
}

/**
 * 基础菜单配置
 */
export const menuConfig: MenuItem[] = [
  {
    path: RoutePath.HOME,
    title: '首页',
    icon: HomeOutline,
    order: 1,
  },
  {
    path: RoutePath.CHAT,
    title: 'AI对话',
    icon: ChatboxOutline,
    order: 2,
  },
  {
    path: RoutePath.MARKET_DATA,
    title: '市场数据',
    icon: BarChartOutline,
    order: 3,
  },
  {
    path: RoutePath.SETTINGS,
    title: '设置',
    icon: SettingsOutline,
    order: 4,
    children: [
      {
        path: 'model',
        title: '模型管理',
        icon: CubeOutline,
        order: 1,
      },
      {
        path: 'app',
        title: '通用设置',
        icon: OptionsOutline,
        order: 2,
      },
      {
        path: 'about',
        title: '关于',
        icon: InformationCircleOutline,
        order: 3,
      },
    ],
  },
]

/**
 * 获取侧边栏菜单（过滤隐藏项并排序）
 */
export function getMenuRoutes(): MenuItem[] {
  return menuConfig
    .filter(route => !route.hidden)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}

/**
 * 获取设置页面子菜单
 */
export function getSettingsMenuRoutes(): MenuItem[] {
  const settingsRoute = menuConfig.find(r => r.path === RoutePath.SETTINGS)
  return (settingsRoute?.children || [])
    .filter(route => !route.hidden)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}
