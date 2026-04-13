import { getAPI } from './index'

export const appApi = {
  getEnvInfo: () => getAPI()?.app.getEnvInfo(),
  getVersion: () => getAPI()?.app.getVersion(),
  setLoginItem: (enabled: boolean) => getAPI()?.app.setLoginItem(enabled),
  getLoginItem: () => getAPI()?.app.getLoginItem(),
  selectDirectory: () => getAPI()?.app.selectDirectory(),
  openLogDir: () => getAPI()?.app.openLogDir()
}

export const windowApi = {
  minimize: () => getAPI()?.window?.minimize?.(),
  maximize: () => getAPI()?.window?.maximize?.(),
  unmaximize: () => getAPI()?.window?.unmaximize?.(),
  close: () => getAPI()?.window?.close?.(),
  setTitlebarColor: (color: string, symbolColor: string) => getAPI()?.window?.setTitlebarColor?.(color, symbolColor)
}

export const updaterApi = {
  check: () => getAPI()?.updater.check(),
  download: () => getAPI()?.updater.download(),
  install: () => getAPI()?.updater.install(),
  onStatus: (callback: (data: any) => void) => getAPI()?.updater.onStatus(callback)
}
