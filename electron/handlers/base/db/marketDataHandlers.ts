import { ipcMain } from 'electron'
import { marketDataOps } from '../../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import { MarketSyncService } from '../../../services/market/marketSyncService'
import log from 'electron-log'

export function initMarketDataHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_MARKET_DATA, (_event, payload) => {
    const { startDate, endDate } = payload || {}
    try {
      if (!startDate || !endDate) {
        return marketDataOps.getAll()
      }
      return marketDataOps.getByDateRange(startDate, endDate)
    } catch (err) {
      log.error('[DB IPC] get-market-data 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_SYNC_MARKET_DATA, async (_event, payload) => {
    const { startDate, endDate, force = false } = payload || {}
    if (!startDate || !endDate) return { success: false, message: '日期参数缺失' }
    
    try {
      const syncService = MarketSyncService.getInstance()
      return await syncService.syncMarketDataRange(startDate, endDate, force)
    } catch (err) {
      log.error('[DB IPC] sync-market-data 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_BATCH_SYNC_XUANGUBAO, async (_event, payload) => {
    const { startDate, endDate, force = false } = payload || {}
    if (!startDate || !endDate) return { success: false, message: '日期参数缺失' }

    try {
      const syncService = MarketSyncService.getInstance()
      return await syncService.batchSyncAllXuangubaoData(startDate, endDate, force)
    } catch (err) {
      log.error('[DB IPC] batch-sync-xuangubao 失败:', err)
      throw err
    }
  })
}
