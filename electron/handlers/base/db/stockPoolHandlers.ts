import { ipcMain } from 'electron'
import { stockPoolOps } from '../../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import { XuanguBaoService } from '../../../services/integration/xuangubaoService'
import log from 'electron-log'

export function initStockPoolHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_STOCK_POOL, (_event, { poolName, date }) => {
    try {
      return stockPoolOps.getByPoolAndDate(poolName, date)
    } catch (err) {
      log.error('[DB IPC] get-stock-pool 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_SYNC_STOCK_POOL, async (_event, { poolName, date }) => {
    try {
      const xuanguBao = XuanguBaoService.getInstance()
      const success = await xuanguBao.syncStockPool(poolName, date)
      return { success }
    } catch (err) {
      log.error('[DB IPC] sync-stock-pool 失败:', err)
      throw err
    }
  })
}
