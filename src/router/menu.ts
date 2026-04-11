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
  Analytics,
  CloseCircleOutline,
  ListOutline,
  FlashOutline,
  TrendingDownOutline,
  TrendingUpOutline,
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
    hidden: true // 迁移至选股通管理下，隐藏旧入口
  },
  {
    path: RoutePath.XUANGUBAO,
    title: '选股通管理',
    icon: OptionsOutline, // 使用 OptionsOutline 作为父级图标
    order: 4,
    children: [
      {
        path: 'indicator',
        title: '涨跌数据管理',
        icon: BarChartOutline,
        order: 1,
      },
      {
        path: 'calendar',
        title: '交易日历管理',
        icon: InformationCircleOutline,
        order: 2,
      },
      {
        path: 'limit-up',
        title: '涨停池分析',
        icon: Analytics,
        order: 3,
      },
      {
        path: 'limit-up-broken',
        title: '炸板池分析',
        icon: CloseCircleOutline,
        order: 4,
      },
      {
        path: 'yesterday-limit-up',
        title: '昨日涨停池分析',
        icon: ListOutline,
        order: 5,
      },
      {
        path: 'strong-stock',
        title: '强势股分析',
        icon: FlashOutline,
        order: 6,
      },
      {
        path: 'limit-down',
        title: '跌停池分析',
        icon: TrendingDownOutline,
        order: 7,
      },
      {
        path: 'surge',
        title: '每日热点分析',
        icon: TrendingUpOutline,
        order: 8,
      }
    ]
  },
  {
    path: RoutePath.SETTINGS,
    title: '设置',
    icon: SettingsOutline,
    order: 5,
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
