/**
 * 模型管理 Composable
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSettingsStore } from '@/stores'
import { MODEL_PRESETS } from '@/constants'
import { log } from '@/utils'
import { modelService } from '@/services'

export function useModels() {
  const settingsStore = useSettingsStore()

  const isDownloading = ref(false)
  const downloadProgress = ref(0)
  const downloadingName = ref('')
  const presets = MODEL_PRESETS

  // 存储清理函数
  const cleanups: (() => void)[] = []

  /**
   * 加载模型列表
   */
  const loadModels = async (): Promise<void> => {
    try {
      const modelList = await modelService.listModels()
      settingsStore.setModels(modelList)
      log.info('Models loaded:', modelList)
    } catch (error) {
      log.error('Failed to load models:', error)
    }
  }

  /**
   * 保存当前选中的模型
   */
  const saveActiveModel = (name?: string): void => {
    const modelName = name ?? settingsStore.activeModelName
    settingsStore.setActiveModelName(modelName)
    log.info('Active model saved:', modelName)
  }

  /**
   * 下载模型
   */
  const downloadModel = (url: string, filename: string): void => {
    isDownloading.value = true
    downloadProgress.value = 0
    downloadingName.value = filename
    modelService.downloadModel(url, filename)
  }

  /**
   * 从自定义 URL 下载模型
   */
  const downloadFromUrl = (url: string): void => {
    const filename = url.split('/').pop() || 'model.gguf'
    downloadModel(url, filename)
  }

  onMounted(() => {
    loadModels()

    // 订阅下载进度
    cleanups.push(
      modelService.onDownloadProgress((data) => {
        downloadProgress.value = data.progress
      })
    )

    // 订阅下载完成
    cleanups.push(
      modelService.onDownloadComplete(() => {
        isDownloading.value = false
        downloadProgress.value = 100
        log.info('Model download complete:', downloadingName.value)
        loadModels()
        setTimeout(() => {
          isDownloading.value = false
          downloadProgress.value = 0
          downloadingName.value = ''
        }, 2000)
      })
    )

    // 订阅下载错误
    cleanups.push(
      modelService.onDownloadError(() => {
        isDownloading.value = false
        downloadProgress.value = 0
        downloadingName.value = ''
      })
    )
  })

  onUnmounted(() => {
    // 执行所有清理函数
    cleanups.forEach((cleanup) => cleanup())
  })

  return {
    models: computed(() => settingsStore.models),
    selectedModel: computed(() => settingsStore.activeModelName),
    isDownloading,
    downloadProgress,
    downloadingName,
    presets,
    loadModels,
    saveActiveModel,
    downloadModel,
    downloadFromUrl,
  }
}
