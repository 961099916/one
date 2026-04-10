/**
 * Electron 主进程类型定义
 */

// 下载配置
export interface DownloadConfig {
  url: string
  filename: string
}

// 聊天请求
export interface ChatRequest {
  sessionId?: string
  prompt: string
  history: Array<{ role: string; content: string }>
  params?: Record<string, unknown>
}
