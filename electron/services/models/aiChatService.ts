import { type BrowserWindow } from 'electron'
import log from 'electron-log'
import { IpcChannel } from '@common/constants'
import type { ChatRequest } from '../../types'
import { appConfigOps } from '../../infrastructure/store/appConfig'
import { OpenAiProvider } from '../ai/providers/openAiProvider'
import type { AiProvider } from '../ai/aiProvider'
import { aiTools, getOpenAiToolsMetadata } from '../ai/aiTools'

/**
 * AI 统一对话服务
 * 作为调度中心，扩展了工具调用（Function Calling）的循环处理逻辑
 */
export class AiChatService {
  private openAiProvider: OpenAiProvider
  private mainWindow: BrowserWindow
  private isProcessing: boolean = false
  private tokenBuffer: string = ''
  private tokenTimer: NodeJS.Timeout | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.openAiProvider = new OpenAiProvider()
  }

  async setActiveModel(_modelName: string): Promise<void> {
    // 接口保留以兼容现有的 Handler 调用，但不再执行任何操作
  }

  async handleChatRequest(request: ChatRequest): Promise<void> {
    if (this.isProcessing) {
      log.warn('[AiChatService] 已经在处理一个请求，忽略重复调用')
      return
    }

    const activeProviderType = (appConfigOps.get('activeAiProvider') || 'deepseek') as 'openai' | 'deepseek'
    log.info(`[AiChatService] 开始处理请求 -> Provider: ${activeProviderType}`)

    this.isProcessing = true
    try {
      const provider = this.getProvider()
      const toolsMetadata = getOpenAiToolsMetadata()
      const cloudConfig = activeProviderType === 'deepseek' 
        ? appConfigOps.get('deepSeekConfig') 
        : appConfigOps.get('openAiConfig')
      
      // 注入默认系统指令，强化 Markdown 和专业性
      const systemPrompt = '你是一个专业的 A 股短线复盘与智能助手“壹复盘”。' +
        '请务必使用 Markdown 格式回复，善于使用表格展示个股数据、使用加粗标识核心结论、使用代码块展示技术指标逻辑。' +
        '在涉及股票代码时，请尽可能使用 [股票名称](代码) 的格式（例如：[贵州茅台](600519)）。'

      let currentHistory = [...request.history]
      
      // 如果没有 system 消息，则在队列最前面插入
      if (!currentHistory.some(m => m.role === 'system')) {
        currentHistory.unshift({ role: 'system', content: systemPrompt })
      }

      let currentPrompt = request.prompt
      log.info(`[AiChatService] [REQUEST] Prompt: ${currentPrompt}`)
      
      let iteration = 0
      const maxIterations = 5 // 防止无限循环
      let fullResponse = ''

      while (iteration < maxIterations) {
        iteration++
        log.debug(`[AiChatService] 迭代轮次: ${iteration}`)

        // 核心：在每一轮大迭代前出让一次 CPU，确保主进程能处理其他 IPC（如侧边栏切换）
        await new Promise(resolve => setImmediate(resolve))

        const result = await provider.generateResponse(
          { ...request, prompt: currentPrompt, history: currentHistory },
          { 
            tools: toolsMetadata.length > 0 ? toolsMetadata : undefined,
            config: cloudConfig
          },
          (token: string) => {
            fullResponse += token
            this.sendChatToken(token)
          }
        )

        // 检查中止
        if (result.aborted) break

        // 如果没有工具调用，说明已生成最终结果
        if (!result.tool_calls || result.tool_calls.length === 0) {
          log.info(`[AiChatService] [RESPONSE] ${fullResponse}`)
          break
        }

        // 处理工具调用
        log.info(`[AiChatService] 收到工具调用指令: ${result.tool_calls.map((tc: any) => tc.function.name).join(', ')}`)
        
        // 将模型本次回复（包含工具调用指令）加入历史
        currentHistory.push({ role: 'assistant', content: result.content || '', tool_calls: result.tool_calls } as any)
        
        // 依次执行工具
        for (const tc of result.tool_calls) {
          // 在执行每个工具前也出让一次时间片
          await new Promise(resolve => setTimeout(resolve, 10))

          const tool = aiTools.find(t => t.name === tc.function.name)
          if (tool) {
            this.sendSystemStatus(`正在执行: ${tool.description.split('，')[0]}...`)
            try {
              const args = JSON.parse(tc.function.arguments)
              log.info(`[AiChatService] 执行工具: ${tc.function.name}, 参数: ${tc.function.arguments}`)
              const output = await tool.execute(args)
              log.info(`[AiChatService] 工具执行结果: ${JSON.stringify(output).slice(0, 200)}${JSON.stringify(output).length > 200 ? '...' : ''}`)
              
              currentHistory.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: tc.function.name,
                content: JSON.stringify(output)
              } as any)
            } catch (err) {
              log.error(`[AiChatService] 工具 ${tc.function.name} 执行失败:`, err)
              currentHistory.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: tc.function.name,
                content: JSON.stringify({ error: '工具执行内部错误' })
              } as any)
            }
          }
        }

        // 在下一轮迭代中，模型将看到工具执行的结果并生成最终文字
        currentPrompt = '' // 后续迭代不需要 prompt，模型直接看历史
        this.sendSystemStatus('') // 清除状态
      }

      this.flushTokens()
      this.sendChatEnd()
    } catch (err: any) {
      log.error(`[AiChatService] ${activeProviderType} 生成失败:`, err)
      this.sendChatError(err.message || '生成回复时出错')
    } finally {
      this.isProcessing = false
      log.info(`[AiChatService] 请求处理结束`)
    }
  }

  stopGeneration(): void {
    this.openAiProvider.stop()
  }

  private getProvider(): AiProvider {
    return this.openAiProvider
  }

  /**
   * 带缓冲的 Token 发送，降低 IPC 频率
   */
  private sendChatToken(token: string): void {
    this.tokenBuffer += token

    if (!this.tokenTimer) {
      this.tokenTimer = setTimeout(() => {
        this.flushTokens()
      }, 30) // 30ms 缓冲，人眼无感知，但能合并大量微小碎片
    }
  }

  private flushTokens(): void {
    if (this.tokenBuffer) {
      this.mainWindow.webContents.send(IpcChannel.CHAT_TOKEN, this.tokenBuffer)
      this.tokenBuffer = ''
    }
    if (this.tokenTimer) {
      clearTimeout(this.tokenTimer)
      this.tokenTimer = null
    }
  }

  private sendSystemStatus(message: string): void {
    this.mainWindow.webContents.send('chat:status', message)
  }

  private sendChatError(message: string): void {
    this.mainWindow.webContents.send(IpcChannel.CHAT_ERROR, message)
  }

  private sendChatEnd(): void {
    this.mainWindow.webContents.send(IpcChannel.CHAT_END)
  }
}
