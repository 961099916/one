/**
 * 模型服务
 * 处理 LLM 模型相关的业务逻辑，封装与主进程的通信
 */
import { electronService } from './electron.service'

export interface ModelInfo {
  name: string
  path: string
}

class ModelService {
  /**
   * 获取本地安装的模型列表
   */
  async listModels(): Promise<ModelInfo[]> {
    try {
      const modelNames = await electronService.invoke<string[]>('list-models')
      return modelNames.map((name) => ({
        name: name,
        path: name,
      }))
    } catch (error) {
      console.error('Failed to list models:', error)
      throw error
    }
  }

  /**
   * 触发模型下载
   */
  downloadModel(url: string, filename: string): void {
    electronService.send('download-model', url, filename)
  }

  /**
   * 监听下载进度
   */
  onDownloadProgress(callback: (data: { filename: string; progress: number }) => void): () => void {
    return electronService.on('download-progress', callback)
  }

  /**
   * 监听下载完成
   */
  onDownloadComplete(callback: () => void): () => void {
    return electronService.on('download-complete', callback)
  }

  /**
   * 监听下载错误
   */
  onDownloadError(callback: (error: any) => void): () => void {
    return electronService.on('chat-error', callback)
  }
}

export const modelService = new ModelService()
export default modelService
