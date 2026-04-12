import { BrowserWindow } from 'electron'
import log from 'electron-log'
import path from 'node:path'
import { WindowConfig } from '../../constants'
import { loadWindowState, VITE_DEV_SERVER_URL, RENDERER_DIST, PRELOAD_PATH } from '../../core/appBootstrap'

export async function createMainWindow(): Promise<BrowserWindow> {
  const windowState = loadWindowState()

  const mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: WindowConfig.MIN_WIDTH,
    minHeight: WindowConfig.MIN_HEIGHT,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#ffffff',
      symbolColor: '#1f2329',
      height: 32
    } : undefined,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  log.info('[WindowManager] Preload 路径:', PRELOAD_PATH)

  if (windowState.isMaximized) {
    mainWindow.maximize()
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  log.info('[WindowManager] 主窗口已创建')
  return mainWindow
}
