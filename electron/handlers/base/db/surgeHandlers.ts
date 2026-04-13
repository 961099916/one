import { ipcMain } from 'electron'
import { surgeOps } from '../../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import { XuanguBaoService } from '../../../services/integration/xuangubaoService'
import log from 'electron-log'

export function initSurgeHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_SURGE_PLATES, (_event, { date, timestamp }) => {
    try {
      return surgeOps.getPlatesByDate({ date, timestamp })
    } catch (err) {
      log.error('[DB IPC] get-surge-plates 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_GET_SURGE_STOCKS, (_event, { date, timestamp }) => {
    try {
      return surgeOps.getStocksByDate({ date, timestamp })
    } catch (err) {
      log.error('[DB IPC] get-surge-stocks 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_GET_SURGE_HISTORICAL_DATES, () => {
    try {
      return surgeOps.getHistoricalDates()
    } catch (err) {
      log.error('[DB IPC] get-surge-historical-dates 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_SYNC_SURGE_DATA, async (_event, date: string) => {
    try {
      const xuanguBao = XuanguBaoService.getInstance()
      const success = await xuanguBao.syncSurgeData(date)
      return { success }
    } catch (err) {
      log.error('[DB IPC] sync-surge-data 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_GET_LATEST_SURGE_TIMESTAMP, (_event, date: string) => {
    try {
      return surgeOps.getLatestTimestampByDate(date)
    } catch (err) {
      log.error('[DB IPC] get-latest-surge-timestamp 失败:', err)
      throw err
    }
  })
}
