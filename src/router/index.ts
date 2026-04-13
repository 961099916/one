import { createRouter, createWebHashHistory } from 'vue-router'
import { toVueRouterRoutes } from './routes'
import { useAuthStore } from '@/stores'

/**
 * 路由配置（使用动态路由配置）
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: toVueRouterRoutes(),
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 确保 Auth 状态已初始化
  await authStore.initialize()

  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // 需要登录但未登录，重定向到登录页
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // 已登录但访问登录页，重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router
