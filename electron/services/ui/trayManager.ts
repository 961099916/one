import { Menu, Tray, nativeImage, type BrowserWindow } from 'electron'
import log from 'electron-log'
import path from 'node:path'

export function createTray(mainWindow: BrowserWindow | null): Tray | null {
  try {
    const iconPath = path.join(process.env.VITE_PUBLIC!, 'tray-icon.png')
    let trayIcon: Electron.NativeImage

    try {
      trayIcon = nativeImage.createFromPath(iconPath)
      if (trayIcon.isEmpty()) throw new Error('icon empty')
    } catch (_) {
      trayIcon = nativeImage.createEmpty()
    }

    const tray = new Tray(trayIcon)
    tray.setToolTip('One AI')

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示 One AI',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          mainWindow?.webContents.session.clearStorageData()
        },
      },
    ])

    tray.setContextMenu(contextMenu)

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus()
        } else {
          mainWindow.show()
        }
      }
    })

    log.info('[TrayManager] 系统托盘已创建')
    return tray
  } catch (err) {
    log.warn('[TrayManager] 创建系统托盘失败（可忽略）:', err)
    return null
  }
}
