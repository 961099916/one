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
  history: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string
    tool_calls?: any[]
    tool_call_id?: string
    name?: string
  }>
  params?: Record<string, unknown>
}
