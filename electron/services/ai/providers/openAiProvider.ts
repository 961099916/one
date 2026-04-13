import log from 'electron-log'
import type { AiProvider } from '../aiProvider'
import type { ChatRequest } from '../../../types'
import { appConfigOps } from '../../../infrastructure/store/appConfig'

/**
 * OpenAI 兼容提供商
 * 支持 OpenAI, DeepSeek, Gemini (OpenAI mode) 等标准接口
 */
export class OpenAiProvider implements AiProvider {
  private abortController: AbortController | null = null
  private isGenerating: boolean = false

  async generateResponse(
    request: ChatRequest,
    options: { tools?: any[], config?: any },
    onToken: (token: string) => void
  ): Promise<any> {
    const config = options.config || appConfigOps.get('openAiConfig')
    const { apiKey, baseUrl, model } = config

    if (!apiKey) throw new Error('未配置 API Key')

    this.isGenerating = true
    this.abortController = new AbortController()

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          messages: [
            ...request.history.map(m => {
              const msg: any = { role: m.role, content: m.content }
              if (m.tool_calls) msg.tool_calls = m.tool_calls
              if (m.tool_call_id) msg.tool_call_id = m.tool_call_id
              if (m.name) msg.name = m.name
              return msg
            }),
            ...(request.prompt ? [{ role: 'user', content: request.prompt }] : [])
          ],
          tools: options.tools,
          stream: true,
          temperature: (request.params?.temperature as number) ?? 0.7,
          max_tokens: (request.params?.maxTokens as number) ?? 2048
        }),
        signal: this.abortController.signal
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`API 请求失败: ${response.status} ${errBody}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      const toolCalls: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const content = line.trim()
          if (!content || !content.startsWith('data:')) continue
          
          const jsonStr = content.replace(/^data: /, '')
          if (jsonStr === '[DONE]') break

          try {
            const json = JSON.parse(jsonStr)
            const delta = json.choices?.[0]?.delta

            // 处理文本 Token
            if (delta?.content) {
              fullContent += delta.content
              onToken(delta.content)
            }

            // 处理工具调用
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCalls[tc.index]) {
                  toolCalls[tc.index] = {
                    id: tc.id,
                    type: 'function',
                    function: { name: '', arguments: '' }
                  }
                }
                if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name
                if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments
              }
            }
          } catch (e) {
            log.warn('[OpenAiProvider] 解析流片段失败:', e)
          }
        }
      }

      return {
        content: fullContent,
        tool_calls: toolCalls.filter(Boolean)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        log.info('[OpenAiProvider] 请求已中止')
        return { content: '', aborted: true }
      } else {
        log.error('[OpenAiProvider] 请求生成失败:', err)
        throw err
      }
    } finally {
      this.isGenerating = false
      this.abortController = null
    }
  }

  stop(): void {
    if (this.isGenerating && this.abortController) {
      this.abortController.abort()
    }
  }

  dispose(): Promise<void> {
    this.stop()
    return Promise.resolve()
  }
}
