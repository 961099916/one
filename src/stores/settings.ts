/**
 * 设置状态 Store
 *
 * 持久化方案：
 * - 核心配置（activeModel、generationParams 等）：electron-store（主进程）
 * - UI 临时状态：Dexie.js（渲染进程 IndexedDB）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { log } from '@/utils/logger'
import type { ModelInfo } from '@/types'

export interface GenerationParams {
  systemPrompt: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  contextSize: number
}

const DEFAULT_PARAMS: GenerationParams = {
  systemPrompt: 'You are a helpful local AI assistant. Please respond in Markdown format.',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  contextSize: 4096,
}

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const activeModelName = ref<string>('')
    const models = ref<ModelInfo[]>([])
    const generationParams = ref<GenerationParams>({ ...DEFAULT_PARAMS })

    // 应用设置
    const theme = ref<'light' | 'dark' | 'auto'>('auto')
    const language = ref<'zh-CN' | 'en-US'>('zh-CN')
    const fontSize = ref(14)
    const sidebarWidth = ref(240)
    const autoCheckUpdate = ref(true)
    const enableTelemetry = ref(false)

    const activeModel = computed(
      () => models.value.find(m => m.name === activeModelName.value) ?? null
    )

    const hasActiveModel = computed(() => !!activeModelName.value)

    /** 初始化时从 electron-store 加载配置 */
    async function initFromStore(): Promise<void> {
      if (!window.electronAPI) return
      try {
        const config = await (window.electronAPI as any).config.getAll()

        // 只在模型文件存在时才使用
        const storedModel = config.activeModel || ''
        activeModelName.value = storedModel.endsWith('.gguf') ? storedModel : ''
        
        generationParams.value = {
          ...DEFAULT_PARAMS,
          ...config.generationParams,
        }
        theme.value = config.theme || 'auto'
        language.value = config.language || 'zh-CN'
        fontSize.value = config.fontSize || 14
        sidebarWidth.value = config.sidebarWidth || 240
        autoCheckUpdate.value = config.autoCheckUpdate ?? true
        enableTelemetry.value = config.enableTelemetry ?? false
      } catch (err) {
        log.error('[SettingsStore] 从 electron-store 加载配置失败:', err)
      }
    }

    async function setActiveModelName(name: string): Promise<void> {
      activeModelName.value = name

      // 通知 Electron 主进程加载模型
      if (window.ipcRenderer) {
        window.ipcRenderer.send('set-active-model', name)
      }

      // 持久化到 electron-store
      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('activeModel', name)
      }
    }

    function setModels(modelList: ModelInfo[]): void {
      models.value = modelList
    }

    async function updateGenerationParams(params: Partial<GenerationParams>): Promise<void> {
      generationParams.value = { ...generationParams.value, ...params }

      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('generationParams', generationParams.value)
      }
    }

    async function resetGenerationParams(): Promise<void> {
      generationParams.value = { ...DEFAULT_PARAMS }

      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('generationParams', generationParams.value)
      }
    }

    async function updateAppSettings(settings: Partial<{
      theme: 'light' | 'dark' | 'auto'
      language: 'zh-CN' | 'en-US'
      fontSize: number
      sidebarWidth: number
      autoCheckUpdate: boolean
      enableTelemetry: boolean
    }>): Promise<void> {
      if (settings.theme !== undefined) theme.value = settings.theme
      if (settings.language !== undefined) language.value = settings.language
      if (settings.fontSize !== undefined) fontSize.value = settings.fontSize
      if (settings.sidebarWidth !== undefined) sidebarWidth.value = settings.sidebarWidth
      if (settings.autoCheckUpdate !== undefined) autoCheckUpdate.value = settings.autoCheckUpdate
      if (settings.enableTelemetry !== undefined) enableTelemetry.value = settings.enableTelemetry

      if (window.electronAPI) {
        for (const [key, value] of Object.entries(settings)) {
          await (window.electronAPI as any).config.set(key, value)
        }
      }
    }

    return {
      activeModelName,
      models,
      generationParams,
      theme,
      language,
      fontSize,
      sidebarWidth,
      autoCheckUpdate,
      enableTelemetry,
      activeModel,
      hasActiveModel,
      initFromStore,
      setActiveModelName,
      setModels,
      updateGenerationParams,
      resetGenerationParams,
      updateAppSettings,
    }
  }
)
