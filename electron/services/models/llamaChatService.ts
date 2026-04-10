/**
 * LLM 聊天服务
 * 负责 LLM 模型的加载、对话生成等核心功能
 */
import * as path from 'path'
import { type BrowserWindow } from 'electron'
import log from 'electron-log'
import { IpcChannel } from '../../constants'
import type { ChatRequest } from '../../types'
import { getModelsDirectory } from '../../utils/fileUtils'

/**
 * LLM 聊天服务
 */
export class LlamaChatService {
  private currentModelName = ''
  private llama: unknown = null
  private model: unknown = null
  private context: unknown = null
  private chatSession: unknown = null
  private isGenerating = false
  private abortController: AbortController | null = null
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /**
   * 获取当前活动模型名称
   */
  getCurrentModelName(): string {
    return this.currentModelName
  }

  /**
   * 设置活动模型
   */
  async setActiveModel(modelName: string): Promise<void> {
    if (this.currentModelName === modelName) {
      return
    }

    log.info(`[LlamaChatService] 切换模型: ${this.currentModelName} -> ${modelName}`)

    if (modelName && !modelName.endsWith('.gguf')) {
      log.warn('[LlamaChatService] 模型不是 GGUF 格式，跳过加载:', modelName)
      this.currentModelName = ''
      return
    }

    this.currentModelName = modelName
    this.resetContext()

    if (!modelName) {
      return
    }

    await this.loadModel(modelName)
  }

  /**
   * 处理聊天请求
   */
  async handleChatRequest(request: ChatRequest): Promise<void> {
    const { prompt } = request as unknown as { prompt: string }

    log.info(`[LlamaChatService] 收到聊天请求: ${this.truncatePrompt(prompt)}...`)

    try {
      // 懒加载：确保上下文和会话已创建
      await this.ensureContext()
    } catch (err) {
      log.error('[LlamaChatService] 准备聊天环境失败:', err)
      this.sendChatError('无法初始化聊天环境，请检查模型文件是否正确')
      return
    }

    if (!this.validateChatState()) return

    try {
      await this.generateResponse(prompt)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        log.info('[LlamaChatService] 生成已被用户中止')
      } else {
        this.handleChatError(err)
      }
    }
  }

  /**
   * 停止生成
   */
  stopGeneration(): void {
    if (this.isGenerating && this.abortController) {
      log.info('[LlamaChatService] 接收到中止指令，停止生成')
      this.abortController.abort()
      this.abortController = null
      this.isGenerating = false
    }
  }

  /**
   * 加载模型权重
   */
  private async loadModel(modelName: string): Promise<void> {
    try {
      log.info(`[LlamaChatService] 正在加载模型权重: ${modelName}`)

      const modelsDir = getModelsDirectory()
      const modelPath = path.join(modelsDir, modelName)

      log.info('[LlamaChatService] 模型路径:', modelPath)

      const { getLlama } = await import('node-llama-cpp')

      this.llama = await getLlama()
      this.model = await (
        this.llama as { loadModel: (opts: { modelPath: string }) => Promise<unknown> }
      ).loadModel({ modelPath })

      // 注意：此处不再立即创建 context 和 session，实现延迟加载以节省内存
      log.info(`[LlamaChatService] 模型权重加载成功: ${modelName}`)
    } catch (err) {
      log.error('[LlamaChatService] 模型加载失败:', err)
      this.resetContext()
      this.currentModelName = ''
    }
  }

  /**
   * 确保上下文和会话已创建（按需延迟初始化）
   */
  private async ensureContext(): Promise<void> {
    if (this.chatSession) return

    if (!this.model) {
      throw new Error('模型权重尚未加载，请先选择模型')
    }

    try {
      log.info('[LlamaChatService] 正在初始化模型上下文和会话（延迟加载模式）...')
      const { LlamaChatSession } = await import('node-llama-cpp')

      // 创建上下文 - 这一步通常会分配 KV 缓存内存
      this.context = await (this.model as { createContext: () => Promise<unknown> }).createContext()

      const sequence = (this.context as { getSequence: () => any }).getSequence()
      this.chatSession = new LlamaChatSession({
        contextSequence: sequence as any,
        chatWrapper: 'auto',
      })

      log.info('[LlamaChatService] 上下文与会话初始化成功')
    } catch (err) {
      log.error('[LlamaChatService] 上下文初始化失败:', err)
      throw err
    }
  }

  /**
   * 重置上下文
   */
  private resetContext(): void {
    this.stopGeneration()
    this.chatSession = null
    this.context = null
    this.model = null
    this.llama = null
    this.isGenerating = false
  }

  /**
   * 验证聊天状态
   */
  private validateChatState(): boolean {
    if (!this.model) {
      this.sendChatError('未加载模型，请先在设置中选择模型')
      return false
    }

    if (!this.chatSession) {
      this.sendChatError('聊天上下文未就绪')
      return false
    }

    if (this.isGenerating) {
      this.sendChatError('正在生成回复中，请稍候')
      return false
    }

    return true
  }

  /**
   * 生成回复
   */
  private async generateResponse(prompt: string): Promise<void> {
    this.isGenerating = true
    log.info('[LlamaChatService] 开始生成回复...')

    try {
      log.info('[LlamaChatService] 使用提示词:', prompt)

      await (
        this.chatSession as {
          prompt: (text: string, opts: { onTextChunk: (text: string) => void }) => Promise<void>
        }
      ).prompt(prompt, {
        onTextChunk: (text: string) => {
          this.sendChatToken(text)
        },
      })

      this.sendChatEnd()
    } catch (err) {
      log.error('[LlamaChatService] 生成回复失败:', err)
      this.sendChatError(err instanceof Error ? err.message : '生成回复时出错')
    } finally {
      this.abortController = null
      this.isGenerating = false
    }

    log.info('[LlamaChatService] 回复生成完成')
  }

  /**
   * 处理聊天错误
   */
  private handleChatError(err: unknown): void {
    const errorMessage = err instanceof Error ? err.message : String(err)
    log.error('[LlamaChatService] 聊天出错:', errorMessage)
    this.sendChatError(errorMessage)
  }

  /**
   * 截断提示词用于日志
   */
  private truncatePrompt(prompt: string): string {
    return prompt.substring(0, 50)
  }

  private sendChatToken(token: string): void {
    this.mainWindow.webContents.send(IpcChannel.CHAT_TOKEN, token)
  }

  private sendChatError(message: string): void {
    this.mainWindow.webContents.send(IpcChannel.CHAT_ERROR, message)
  }

  private sendChatEnd(): void {
    this.mainWindow.webContents.send(IpcChannel.CHAT_END)
  }
}
