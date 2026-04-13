import { ipcMain } from 'electron'
import { tradingDayOps } from '../../../infrastructure/database'
import { IpcChannel } from '@common/constants'
import log from 'electron-log'

export function initTradingDayHandlers(): void {
  ipcMain.handle(IpcChannel.DB_GET_ALL_TRADING_DAYS, () => {
    try {
      return tradingDayOps.getAll()
    } catch (err) {
      log.error('[DB IPC] get-all-trading-days 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_GET_LATEST_TRADING_DAY, () => {
    try {
      return tradingDayOps.getLatestTradingDay()
    } catch (err) {
      log.error('[DB IPC] get-latest-trading-day 失败:', err)
      throw err
    }
  })

  ipcMain.handle(IpcChannel.DB_UPDATE_TRADING_DAY, (_event, { date, isTrading }) => {
    try {
      tradingDayOps.saveStatus(date, isTrading)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] update-trading-day 失败:', err)
      throw err
    }
  })
}
