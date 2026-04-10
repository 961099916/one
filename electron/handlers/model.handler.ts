/**
 * 模型相关 IPC 处理器
 * 负责将 IPC 请求路由到对应的服务
 * 采用延迟加载模式，减少启动时内存占用
 */
import { ipcMain, type BrowserWindow } from 'electron'
import log from 'electron-log'
import { IpcChannel } from '../constants'
import type { ChatRequest } from '../types'

/**
 * 延迟加载的服务实例
 */
let fileService: any = null
let downloadService: any = null
let chatService: any = null
let mainWindowRef: BrowserWindow | null = null

/**
 * 懒加载 ModelFileService
 */
async function getFileService(): Promise<any> {
  if (!fileService && mainWindowRef) {
    const { ModelFileService } = await import('../services/models/modelFileService')
    fileService = new ModelFileService(mainWindowRef)
    log.debug('[ModelIpcHandlers] ModelFileService 已延迟加载')
  }
  return fileService
}

/**
 * 懒加载 ModelDownloadService
 */
async function getDownloadService(): Promise<any> {
  if (!downloadService && mainWindowRef) {
    const { ModelDownloadService } = await import('../services/models/modelDownloadService')
    downloadService = new ModelDownloadService(mainWindowRef)
    log.debug('[ModelIpcHandlers] ModelDownloadService 已延迟加载')
  }
  return downloadService
}

/**
 * 懒加载 LlamaChatService
 */
async function getChatService(): Promise<any> {
  if (!chatService && mainWindowRef) {
    const { LlamaChatService } = await import('../services/models/llamaChatService')
    chatService = new LlamaChatService(mainWindowRef)
    log.debug('[ModelIpcHandlers] LlamaChatService 已延迟加载')
  }
  return chatService
}

/**
 * 初始化模型相关的 IPC 处理器
 */
export function initModelIpcHandlers(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow

  // 模型文件管理 - 按需加载
  ipcMain.handle(IpcChannel.LIST_MODELS, async () => {
    log.info('[IPC] 调用 LIST_MODELS')
    const service = await getFileService()
    return await service.listModels()
  })

  ipcMain.handle(IpcChannel.DELETE_MODEL, async (_event, modelName: string) => {
    log.info('[IPC] 调用 DELETE_MODEL, modelName:', modelName)
    const service = await getFileService()
    const result = await service.deleteModel(modelName)
    // 如果删除的是当前模型，需要通知 chatService
    if (chatService && result.success && (await service.getCurrentModelName()) === modelName) {
      const chat = await getChatService()
      await chat.setActiveModel('')
    }
    return result
  })

  ipcMain.handle(IpcChannel.IMPORT_MODEL, async () => {
    log.info('[IPC] 调用 IMPORT_MODEL')
    const service = await getFileService()
    return await service.importModel()
  })

  // 模型下载 - 按需加载
  ipcMain.on(IpcChannel.DOWNLOAD_MODEL, async (_event, url: string, filename: string) => {
    log.info('[IPC] 调用 DOWNLOAD_MODEL, filename:', filename)
    const service = await getDownloadService()
    await service.downloadModel(url, filename)
  })

  // LLM 聊天 - 按需加载
  ipcMain.on(IpcChannel.SET_ACTIVE_MODEL, async (_event, modelName: string) => {
    log.info('[IPC] 调用 SET_ACTIVE_MODEL, modelName:', modelName)
    const service = await getChatService()
    await service.setActiveModel(modelName)
  })

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

  log.info('[ModelIpcHandlers] 模型处理器初始化完成（延迟加载模式）')
}
