/**
 * 聊天服务
 * 处理 LLM 聊天相关的业务逻辑，封装与主进程的流式通信
 */
import { electronService } from './electron.service'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatParams {
  temperature?: number
  top_p?: number
  max_tokens?: number
  repeat_penalty?: number
  [key: string]: any
}

class ChatService {
  private readonly CH_START_CHAT = 'start-chat'
  private readonly CH_STOP_CHAT = 'stop-chat'
  private readonly CH_CHAT_TOKEN = 'chat-token'
  private readonly CH_CHAT_END = 'chat-end'
  private readonly CH_CHAT_ERROR = 'chat-error'
  private readonly CH_SET_ACTIVE_MODEL = 'set-active-model'

  /**
   * 设置当前活跃模型
   */
  setActiveModel(modelName: string): void {
    electronService.send(this.CH_SET_ACTIVE_MODEL, modelName)
  }

  /**
   * 开始聊天生成
   */
  startChat(options: { prompt: string; history: ChatMessage[]; params: ChatParams }): void {
    electronService.send(this.CH_START_CHAT, options)
  }

  /**
   * 停止当前聊天生成
   */
  stopChat(): void {
    electronService.send(this.CH_STOP_CHAT)
  }

  /**
   * 监听 Token 输出
   */
  onToken(callback: (token: string) => void): () => void {
    return electronService.on(this.CH_CHAT_TOKEN, callback)
  }

  /**
   * 监听聊天结束
   */
  onChatEnd(callback: () => void): () => void {
    return electronService.on(this.CH_CHAT_END, callback)
  }

  /**
   * 监听聊天错误
   */
  onChatError(callback: (error: string) => void): () => void {
    return electronService.on(this.CH_CHAT_ERROR, callback)
  }
}

export const chatService = new ChatService()
export default chatService
