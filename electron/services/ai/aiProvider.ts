import type { ChatRequest } from '../../types'

/**
 * AI 服务提供商抽象接口
 */
export interface AiProvider {
  /**
   * 生成对话响应
   * @param request 聊天请求参数
   * @param options 额外选项（如工具定义）
   * @param onToken Token 回调函数
   */
  generateResponse(
    request: ChatRequest,
    options: { tools?: any[] },
    onToken: (token: string) => void
  ): Promise<any> // 返回值可以是最终结果或工具调用指令

  /**
   * 停止当前生成
   */
  stop(): void

  /**
   * 资源清理
   */
  dispose?(): Promise<void>
}
