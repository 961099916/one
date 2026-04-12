import { ipcMain } from 'electron'
import { IpcChannel } from '../../constants'
import { TdxService } from '../../services/integration/tdxService'

export function initTdxHandlers(): void {
  const tdxService = TdxService.getInstance()

  ipcMain.handle(
    IpcChannel.TDX_GET_MINUTE_DATA,
    async (
      _event,
      params: { tdxPath: string; symbol: string; date: string; period?: '1' | '5' }
    ) => {
      const { tdxPath, symbol, date, period = '5' } = params
      return await tdxService.getMinuteData({ tdxPath, symbol, date, period })
    }
  )

  ipcMain.handle(
    IpcChannel.TDX_OPEN_STOCK,
    async (_event, symbol: string) => {
      return await tdxService.openStock(symbol)
    }
  )
}
