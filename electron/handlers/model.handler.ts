/**
 * 模型相关 IPC 处理器
 * 负责将 IPC 请求路由到对应的服务
 * 仅保留云端聊天相关接口
 */
import { ipcMain, type BrowserWindow } from 'electron'
import log from 'electron-log'
import { IpcChannel } from '@common/constants'
import type { ChatRequest } from '../types'

/**
 * 延迟加载的服务实例
 */
let chatService: any = null
let mainWindowRef: BrowserWindow | null = null

/**
 * 懒加载 AiChatService
 */
async function getChatService(): Promise<any> {
  if (!chatService && mainWindowRef) {
    const { AiChatService } = await import('../services/models/aiChatService')
    chatService = new AiChatService(mainWindowRef)
    log.debug('[ModelIpcHandlers] AiChatService 已延迟加载')
  }
  return chatService
}

/**
 * 初始化模型相关的 IPC 处理器
 */
export function initModelIpcHandlers(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow

  // LLM 聊天 - 按需加载
  ipcMain.on(IpcChannel.START_CHAT, async (_event, request: ChatRequest) => {
    log.info('[IPC] 调用 START_CHAT, sessionId:', request.sessionId)
    const service = await getChatService()
    await service.handleChatRequest(request)
  })

  ipcMain.on(IpcChannel.STOP_CHAT, async () => {
    log.info('[IPC] 调用 STOP_CHAT')
    const service = await getChatService()
    if (service) {
      service.stopGeneration()
    }
  })

  log.info('[ModelIpcHandlers] 模型处理器初始化完成')
}
