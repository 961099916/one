import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { menuConfig, getMenuRoutes, type MenuItem } from '@/router/menu'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const loading = ref(false)
  const menus = ref<MenuItem[]>([])
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  /**
   * 初始化 Auth 状态 (本地版)
   */
  async function initialize() {
    if (isInitialized.value) return
    
    // 从本地存储恢复用户状态（如果有）
    const savedUser = localStorage.getItem('one-user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
    
    await fetchMenus()
    isInitialized.value = true
  }

  /**
   * 登录逻辑 (本地版)
   */
  async function login(email: string, password: string) {
    loading.value = true
    console.log('[Auth] 执行本地登录鉴权:', { email })
    
    try {
      // 简单的本地模拟逻辑，您可以根据需要连接本地数据库
      if ((email === 'admin@example.com' && password === 'admin123') || email === 'admin') {
        const mockUser = {
          id: 'local-admin-id',
          email: email,
          user_metadata: { full_name: 'Admin' }
        }
        user.value = mockUser
        localStorage.setItem('one-user', JSON.stringify(mockUser))
        await fetchMenus()
        return { success: true }
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    user.value = null
    localStorage.removeItem('one-user')
    menus.value = []
  }

  /**
   * 从本地配置加载菜单
   */
  async function fetchMenus() {
    // 彻底回归本地：不再请求 Supabase，直接使用 router/menu.ts 定义
    console.log('[Auth] 从本地配置加载菜单项')
    menus.value = getMenuRoutes()
  }

  return {
    user,
    loading,
    menus,
    isAuthenticated,
    initialize,
    login,
    logout,
    fetchMenus
  }
}, {
  persist: {
    paths: ['user']
  }
})
