/**
 * 应用全局状态 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings } from '@common/types/app'
import { uiService, electronService } from '@/services'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  version?: string
  releaseNotes?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  error?: string
  isAuthError?: boolean
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'auto',
  language: 'zh-CN',
  autoCheckUpdate: true,
  enableTelemetry: false,
  fontSize: 14,
  sidebarWidth: 260,
  autoLoadModel: false,
  tdxPath: '',
  thsPath: '',
  linkagePreference: 'tdx',
  proxy: {
    enable: false,
    protocol: 'http',
    host: '127.0.0.1',
    port: 7890
  },
  updateMirror: 'direct',
  customMirrorUrl: ''
}

export const useAppStore = defineStore(
  'app',
  () => {
    // ==================== UI配置（localStorage 持久化） ====================

    const settings = ref<AppSettings>({ ...DEFAULT_APP_SETTINGS })
    const sidebarCollapsed = ref(false)

    // ==================== 运行时状态（不持久化） ====================

    const isLoading = ref(false)
    const loginItemEnabled = ref(false)

    // 更新状态
    const updateStatus = ref<UpdateStatus>('idle')
    const updateInfo = ref<UpdateInfo>({})

    // ==================== 计算属性 ====================

    const currentTheme = computed<'light' | 'dark'>(() => {
      if (settings.value.theme === 'auto') {
        return uiService.getSystemTheme()
      }
      return settings.value.theme as 'light' | 'dark'
    })

    // ==================== 主题 ====================

    function setTheme(theme: 'light' | 'dark' | 'auto'): void {
      settings.value.theme = theme
      uiService.applyTheme(theme)
    }

    // ==================== 应用设置 ====================

    function updateSettings(newSettings: Partial<AppSettings>): void {
      settings.value = { ...settings.value, ...newSettings }
      
      // 同步到主进程 electron-store
      if (window.electronAPI?.config) {
        for (const [key, value] of Object.entries(newSettings)) {
          window.electronAPI.config.set(key, value)
        }
      }

      if (newSettings.theme) uiService.applyTheme(newSettings.theme)
      if (newSettings.fontSize) {
        uiService.setCssVariable('--font-size-base', `${newSettings.fontSize}px`)
      }
      if (newSettings.sidebarWidth) {
        uiService.setCssVariable('--sidebar-width', `${newSettings.sidebarWidth}px`)
      }
    }

    function resetSettings(): void {
      settings.value = { ...DEFAULT_APP_SETTINGS }
      uiService.applyTheme(settings.value.theme)
    }

    function setLoading(loading: boolean): void {
      isLoading.value = loading
    }

    function toggleSidebar(): void {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    // ==================== 开机启动 ====================

    async function fetchLoginItem(): Promise<void> {
      if (!electronService.isElectron) return
      try {
        loginItemEnabled.value = (await electronService.api.app.getLoginItem()) as boolean
      } catch (_) {
        /* ignore */
      }
    }

    async function setLoginItem(enabled: boolean): Promise<void> {
      if (!electronService.isElectron) return
      await electronService.api.app.setLoginItem(enabled)
      loginItemEnabled.value = enabled
    }

    // ==================== 更新状态 ====================

    function setUpdateStatus(status: UpdateStatus, info?: UpdateInfo): void {
      updateStatus.value = status
      if (info) updateInfo.value = info
    }

    // ==================== 初始化 ====================

    function initializeApp(): void {
      uiService.applyTheme(settings.value.theme)
      uiService.setCssVariable('--font-size-base', `${settings.value.fontSize}px`)
      uiService.setCssVariable('--sidebar-width', `${settings.value.sidebarWidth}px`)

      // 监听系统主题变化
      uiService.onSystemThemeChange(() => {
        if (settings.value.theme === 'auto') uiService.applyTheme('auto')
      })

      // 获取开机启动状态
      fetchLoginItem()
    }

    return {
      settings,
      sidebarCollapsed,
      isLoading,
      loginItemEnabled,
      updateStatus,
      updateInfo,
      currentTheme,
      setTheme,
      updateSettings,
      resetSettings,
      setLoading,
      toggleSidebar,
      fetchLoginItem,
      setLoginItem,
      setUpdateStatus,
      initializeApp,
    }
  },
  {
    persist: {
      key: 'one-app-store',
      storage: localStorage,
      paths: ['sidebarCollapsed', 'settings'],
    },
  }
)
