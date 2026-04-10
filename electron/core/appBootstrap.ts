import { app, type BrowserWindow, dialog } from 'electron'
import { initLogger, logger as log } from '../utils/logger'
import { createMainWindow, createTray, buildAppMenu } from '../services/ui'
import { initStorageDirs } from '../infrastructure/storage'
import { initDB, closeDB } from '../infrastructure/database'
import { initAllHandlers } from '../handlers/base'
import { initModelIpcHandlers } from '../handlers/model.handler'
import { windowStateOps } from '../infrastructure/store'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initCronService, cronOps, closeCronService } from './cronService'
import { registerAllTaskHandlers } from '../services/tasks/register'
import { UpdateService } from '../services/core/updateService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
Object.assign(globalThis, { __filename, __dirname })

process.env.APP_ROOT = path.join(__dirname, '../../')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

export const MAIN_DIST = __dirname
export const PRELOAD_PATH = path.join(MAIN_DIST, 'preload.mjs')

const projectRoot = path.resolve(__dirname, '..')
export const RENDERER_DIST = path.join(projectRoot, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(projectRoot, 'public') : RENDERER_DIST

log.info('[Bootstrap] __dirname:', __dirname)
log.info('[Bootstrap] projectRoot:', projectRoot)
log.info('[Bootstrap] MAIN_DIST:', MAIN_DIST)
log.info('[Bootstrap] PRELOAD_PATH:', PRELOAD_PATH)
log.info('[Bootstrap] VITE_PUBLIC:', process.env.VITE_PUBLIC)

let mainWindow: BrowserWindow | null = null

export function loadWindowState() {
  const state = windowStateOps.load()
  log.debug('[Bootstrap] 加载窗口状态:', state)
  return state
}

export function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  try {
    const isMaximized = mainWindow.isMaximized()
    const bounds = mainWindow.getBounds()
    const state = {
      ...bounds,
      isMaximized,
    }
    windowStateOps.save(state)
  } catch (err) {
    log.warn('[Bootstrap] 保存窗口状态失败:', err)
  }
}

export async function bootstrap(): Promise<void> {
  initLogger()

  const gotLock = app.requestSingleInstanceLock()

  if (!gotLock) {
    log.info('[Bootstrap] 已有运行实例，退出')
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show()
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    log.info(`[Bootstrap] One AI ${app.getVersion()} 启动`)
    log.info(`[Bootstrap] 平台: ${process.platform} ${process.arch}`)

    try {
      await initStorageDirs()
    } catch (err) {
      log.error('[Bootstrap] 存储目录初始化失败:', err)
      dialog.showErrorBox('启动失败', `存储目录初始化失败: ${err instanceof Error ? err.message : String(err)}`)
      app.quit()
      return
    }

    try {
      initDB()
    } catch (err) {
      log.error('[Bootstrap] 数据库初始化失败:', err)
      dialog.showErrorBox('数据库错误', `无法初始化数据库: ${err instanceof Error ? err.message : String(err)}\n\n这可能是因为已有另一个应用实例正在运行，请先彻底关闭应用后再尝试。`)
      app.quit()
      return
    }

    try {
      initCronService()
      registerAllTaskHandlers()
      cronOps.loadAndScheduleAll()
    } catch (err) {
      log.error('[Bootstrap] 定时任务服务初始化失败:', err)
    }

    initAllHandlers()
    buildAppMenu()

    mainWindow = await createMainWindow()
    mainWindow.on('close', saveWindowState)
    mainWindow.on('closed', () => {
      mainWindow = null
    })

    if (mainWindow) {
      initModelIpcHandlers(mainWindow)
      
      // 初始化更新服务
      const updateService = UpdateService.getInstance()
      updateService.init(mainWindow)
      
      // 启动后延迟检查更新 (仅生产环境)
      if (app.isPackaged) {
        setTimeout(() => {
          updateService.checkForUpdates()
        }, 5000)
      }
    }

    if (process.platform !== 'linux') {
      createTray(mainWindow)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      closeDB()
      app.quit()
    }
  })

  app.on('activate', () => {
    if (!mainWindow) {
      createMainWindow().then(win => {
        mainWindow = win
      })
    } else if (mainWindow) {
      mainWindow.show()
    }
  })

  app.on('will-quit', () => {
    closeCronService()
    closeDB()
  })
}
