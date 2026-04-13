/**
 * 聊天业务相关类型定义
 */

/** 消息角色类型 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

/** 工具调用 */
export interface ToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

/** 数据库会话行实体 */
export interface SessionRow {
  id: string
  title: string
  created_at: number
  updated_at: number
}

/** 数据库消息行实体 */
export interface MessageRow {
  id: number
  session_id: string
  role: string
  content: string
  created_at: number
}

/** 前端渲染用的消息接口 */
export interface ChatMessage {
  role: MessageRole
  content: string
  tool_calls?: ToolCall[]
}
