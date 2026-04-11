/**
 * 应用路由配置（大厂动态路由风格）
 */
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Home from '@/views/Home.vue'
import Chat from '@/views/Chat.vue'
import SettingsLayout from '@/views/SettingsLayout.vue'
import ModelSettings from '@/views/Settings.vue'
import AppSettings from '@/views/AppSettings.vue'
import About from '@/views/About.vue'
import { RoutePath, RouteName } from '@/constants'

/**
 * 路由配置项（扩展类型）
 */
export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'children' | 'meta'> {
  name?: string
  meta?: {
    /** 页面标题 */
    title: string
    /** 是否需要认证 */
    requiresAuth?: boolean
  }
  children?: AppRouteRecordRaw[]
}

/**
 * 基础路由配置
 */
export const baseRoutes: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: RoutePath.HOME,
    children: [
      {
        path: RoutePath.HOME,
        name: RouteName.HOME,
        component: Home,
        meta: {
          title: '首页',
        },
      },
      {
        path: RoutePath.CHAT,
        name: RouteName.CHAT,
        component: Chat,
        meta: {
          title: 'AI对话',
        },
      },
      {
        path: RoutePath.MARKET_DATA,
        name: RouteName.MARKET_DATA,
        component: () => import('@/views/MarketData.vue'),
        meta: {
          title: '市场数据',
        },
      },
      {
        path: RoutePath.XUANGUBAO,
        name: RouteName.XUANGUBAO,
        redirect: RoutePath.XUANGUBAO_INDICATOR,
        meta: {
          title: '选股通管理',
        },
        children: [
          {
            path: 'indicator',
            name: RouteName.XUANGUBAO_INDICATOR,
            component: () => import('@/views/MarketData.vue'),
            meta: {
              title: '涨跌数据管理',
            },
          },
          {
            path: 'calendar',
            name: 'XuanguBaoCalendar',
            component: () => import('@/views/TradingCalendar.vue'),
            meta: {
              title: '交易日历管理',
            },
          }
        ]
      },
      {
        path: RoutePath.SETTINGS,
        name: RouteName.SETTINGS,
        component: SettingsLayout,
        redirect: RoutePath.SETTINGS_MODEL,
        meta: {
          title: '设置',
        },
        children: [
          {
            path: 'model',
            name: RouteName.SETTINGS_MODEL,
            component: ModelSettings,
            meta: {
              title: '模型管理',
            },
          },
          {
            path: 'app',
            name: RouteName.SETTINGS_APP,
            component: AppSettings,
            meta: {
              title: '通用设置',
            },
          },
          {
            path: 'about',
            name: RouteName.ABOUT,
            component: About,
            meta: {
              title: '关于',
            },
          },
        ],
      },
    ],
  },
]

/**
 * 转换为 Vue Router 标准格式
 */
export function toVueRouterRoutes(): RouteRecordRaw[] {
  return baseRoutes as RouteRecordRaw[]
}
