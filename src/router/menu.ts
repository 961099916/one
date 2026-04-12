/**
 * 菜单配置（从路由中分离，避免循环依赖）
 */
import type { Component } from 'vue'
import {
  HomeOutline,
  ChatboxOutline,
  CubeOutline,
  OptionsOutline,
  InformationCircleOutline,
  BarChartOutline,
  Analytics,
  CloseCircleOutline,
  ListOutline,
  FlashOutline,
  TrendingDownOutline,
  HeartOutline,
} from '@vicons/ionicons5'
import { RoutePath } from '@/constants'

export interface MenuItem {
  path: string
  title: string
  icon?: Component
  hidden?: boolean
  order?: number
}

/**
 * 基础菜单配置 - 全部扁平化
 */
export const menuConfig: MenuItem[] = [
  {
    path: RoutePath.XUANGUBAO_SENTIMENT_CYCLE,
    title: '情绪周期',
    icon: HeartOutline,
    order: 1,
  },
  {
    path: RoutePath.XUANGUBAO_SURGE_REVIEW,
    title: '热点复盘',
    icon: Analytics,
    order: 2,
  },
  {
    path: RoutePath.XUANGUBAO_INDICATOR,
    title: '涨跌管理',
    icon: BarChartOutline,
    order: 10,
  },
  {
    path: RoutePath.XUANGUBAO_CALENDAR,
    title: '交易日历',
    icon: InformationCircleOutline,
    order: 11,
  },
  {
    path: RoutePath.XUANGUBAO_LIMIT_UP,
    title: '涨停分析',
    icon: Analytics,
    order: 12,
  },
  {
    path: RoutePath.XUANGUBAO_LIMIT_UP_BROKEN,
    title: '炸板分析',
    icon: CloseCircleOutline,
    order: 13,
  },
  {
    path: RoutePath.XUANGUBAO_YESTERDAY_LIMIT_UP,
    title: '昨日涨停',
    icon: ListOutline,
    order: 14,
  },
  {
    path: RoutePath.XUANGUBAO_STRONG_STOCK,
    title: '强势个股',
    icon: FlashOutline,
    order: 15,
  },
  {
    path: RoutePath.XUANGUBAO_LIMIT_DOWN,
    title: '跌停分析',
    icon: TrendingDownOutline,
    order: 16,
  },
  {
    path: RoutePath.CHAT,
    title: 'AI对话',
    icon: ChatboxOutline,
    order: 18,
  },
  {
    path: RoutePath.SETTINGS_MODEL,
    title: '模型管理',
    icon: CubeOutline,
    order: 30,
  },
  {
    path: RoutePath.SETTINGS_APP,
    title: '通用设置',
    icon: OptionsOutline,
    order: 31,
  },
  {
    path: RoutePath.ABOUT,
    title: '关于应用',
    icon: InformationCircleOutline,
    order: 32,
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
 * 获取设置页面子菜单（用于设置布局页面内导航）
 */
export function getSettingsMenuRoutes(): MenuItem[] {
  return menuConfig
    .filter(route => route.path.startsWith('/settings/') && !route.hidden)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}
