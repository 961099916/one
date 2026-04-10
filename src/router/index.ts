import { createRouter, createWebHashHistory } from 'vue-router'
import { toVueRouterRoutes } from './routes'

/**
 * 路由配置（使用动态路由配置）
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: toVueRouterRoutes(),
})

export default router
