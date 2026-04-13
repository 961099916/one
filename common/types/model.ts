/**
 * AI 模型相关类型定义
 */

/** 模型信息接口 */
export interface ModelInfo {
  name: string
  path: string
}

/** 预设模型配置 */
export interface ModelPreset {
  name: string
  displayName: string
  modelId: string
  url: string
  filename: string
}

/** 生成参数配置 */
export interface GenerationParams {
  /** 系统提示词 */
  systemPrompt: string
  /** 温度：控制随机性，0-2 之间 */
  temperature: number
  /** Top P：核采样参数 */
  topP: number
  /** Top K：从概率最高的 K 个 token 中采样 */
  topK: number
  /** 最大生成 token 数 */
  maxTokens: number
  /** 上下文窗口大小 */
  contextSize: number
}
