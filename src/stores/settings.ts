import { defineStore } from 'pinia'
import { ref } from 'vue'
import { log } from '@/utils/logger'

export interface GenerationParams {
  systemPrompt: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  contextSize: number
}

const DEFAULT_PARAMS: GenerationParams = {
  systemPrompt: '你是一个专业的 A 股短线复盘与智能助手“壹复盘”。请务必使用 Markdown 格式回复。',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  contextSize: 4096,
}

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const generationParams = ref<GenerationParams>({ ...DEFAULT_PARAMS })

    // 应用设置
    const theme = ref<'light' | 'dark' | 'auto'>('auto')
    const language = ref<'zh-CN' | 'en-US'>('zh-CN')
    const fontSize = ref(14)
    const sidebarWidth = ref(240)
    const autoCheckUpdate = ref(true)
    const enableTelemetry = ref(false)

    // AI 服务商设置
    const activeAiProvider = ref<'openai' | 'deepseek'>('deepseek')
    const openAiConfig = ref({
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o'
    })
    const deepSeekConfig = ref({
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat'
    })

    /** 初始化时从 electron-store 加载配置 */
    async function initFromStore(): Promise<void> {
      if (!window.electronAPI) return
      try {
        const config = await (window.electronAPI as any).config.getAll()

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
        
        // 如果旧配置是 local，则强制切换到 deepseek
        const provider = config.activeAiProvider
        activeAiProvider.value = (provider === 'openai' || provider === 'deepseek') ? provider : 'deepseek'
        
        if (config.openAiConfig) {
          openAiConfig.value = { ...openAiConfig.value, ...config.openAiConfig }
        }
        if (config.deepSeekConfig) {
          deepSeekConfig.value = { ...deepSeekConfig.value, ...config.deepSeekConfig }
        }
      } catch (err) {
        log.error('[SettingsStore] 从 electron-store 加载配置失败:', err)
      }
    }

    async function setActiveAiProvider(provider: 'openai' | 'deepseek'): Promise<void> {
      activeAiProvider.value = provider
      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('activeAiProvider', provider)
      }
    }

    async function updateOpenAiConfig(config: Partial<{ apiKey: string; baseUrl: string; model: string }>): Promise<void> {
      openAiConfig.value = { ...openAiConfig.value, ...config }
      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('openAiConfig', { ...openAiConfig.value })
      }
    }

    async function updateDeepSeekConfig(config: Partial<{ apiKey: string; baseUrl: string; model: string }>): Promise<void> {
      deepSeekConfig.value = { ...deepSeekConfig.value, ...config }
      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('deepSeekConfig', { ...deepSeekConfig.value })
      }
    }

    async function updateGenerationParams(params: Partial<GenerationParams>): Promise<void> {
      generationParams.value = { ...generationParams.value, ...params }

      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('generationParams', { ...generationParams.value })
      }
    }

    async function resetGenerationParams(): Promise<void> {
      generationParams.value = { ...DEFAULT_PARAMS }

      if (window.electronAPI) {
        await (window.electronAPI as any).config.set('generationParams', { ...generationParams.value })
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
      generationParams,
      theme,
      language,
      fontSize,
      sidebarWidth,
      autoCheckUpdate,
      enableTelemetry,
      activeAiProvider,
      openAiConfig,
      deepSeekConfig,
      initFromStore,
      setActiveAiProvider,
      updateOpenAiConfig,
      updateDeepSeekConfig,
      updateGenerationParams,
      resetGenerationParams,
      updateAppSettings,
    }

  }
)
