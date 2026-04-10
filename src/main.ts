import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import naive from 'naive-ui'
import App from '@/App.vue'
import router from '@/router'
import '@/assets/main.css'
import '@/assets/tailwind.css'
import { log } from '@/utils/logger'
import { useAppStore, useChatStore, useSettingsStore } from '@/stores'
import type { ModelInfo } from '@/types'

/**
 * 应用入口
 */
const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(naive)
app.use(router)

app.mount('#app').$nextTick(async () => {
  const appStore = useAppStore()
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()

  // 初始化应用（主题/CSS变量等）
  appStore.initializeApp()

  if (window.electronAPI) {
    // 从 electron-store 加载设置配置
    await settingsStore.initFromStore()

    // 从 SQLite 加载会话 + 消息
    await chatStore.ensureSession()

    // 加载模型列表
    const models = await window.ipcRenderer.invoke('list-models')
    settingsStore.setModels(models as ModelInfo[])

    // 若有已选模型且开启了自动加载，通知主进程加载
    if (settingsStore.activeModelName && appStore.settings.autoLoadModel) {
      window.ipcRenderer.send('set-active-model', settingsStore.activeModelName)
    }

    // 监听更新状态推送
    if (window.electronAPI.updater) {
      window.electronAPI.updater.onStatus((statusData: any) => {
        const statusMap: Record<string, 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'> = {
          checking: 'checking',
          available: 'available',
          'not-available': 'not-available',
          downloading: 'downloading',
          downloaded: 'downloaded',
          error: 'error',
        }
        appStore.setUpdateStatus(statusMap[statusData.status] ?? 'idle', statusData)
      })

      // 自动检查更新（若开启）
      if (appStore.settings.autoCheckUpdate) {
        setTimeout(() => {
          window.electronAPI.updater?.check()
        }, 3000)
      }
    }

    // 监听主进程消息
    window.ipcRenderer.on('main-process-message', (_event, message) => {
      log.info('[Main Process]', message)
    })
  } else {
    // 非 Electron 环境（浏览器预览）
    await chatStore.ensureSession()
  }

  log.info('App initialized')
})
