import { ipcMain } from 'electron'
import { IpcChannel } from '@common/constants'
import { TongHuaShunService } from '../../services/integration/tonghuashunService'
import { appConfigOps } from '../../infrastructure/store/appConfig'
import log from 'electron-log'

export function initTongHuaShunHandlers(): void {
  log.info('[TongHuaShun IPC] 初始化同花顺 IPC 处理器')

  // 打开股票
  ipcMain.handle(IpcChannel.OPEN_TONGHUASHUN_STOCK, async (_event, stockCode: string) => {
    log.info(`[IPC] 调用 OPEN_TONGHUASHUN_STOCK, stockCode: ${stockCode}`)
    const thsPath = appConfigOps.get('thsPath')
    const service = TongHuaShunService.getInstance()
    return await service.openStock(stockCode, thsPath)
  })

  // 打开同花顺应用
  ipcMain.handle(IpcChannel.OPEN_TONGHUASHUN_APP, async () => {
    log.info('[IPC] 调用 OPEN_TONGHUASHUN_APP')
    const service = TongHuaShunService.getInstance()
    return await service.openApp()
  })
}
