import { initConfigHandlers } from './configHandlers'
import { initSessionHandlers } from './sessionHandlers'
import { initMessageHandlers } from './messageHandlers'
import { initMarketDataHandlers } from './marketDataHandlers'
import { initStockPoolHandlers } from './stockPoolHandlers'
import { initSurgeHandlers } from './surgeHandlers'
import { initTradingDayHandlers } from './tradingDayHandlers'
import { initSentimentHandlers } from './sentimentHandlers'
import log from 'electron-log'

export function initDbHandlers(): void {
  initConfigHandlers()
  initSessionHandlers()
  initMessageHandlers()
  initMarketDataHandlers()
  initStockPoolHandlers()
  initSurgeHandlers()
  initTradingDayHandlers()
  initSentimentHandlers()
  log.info('[DB IPC] 数据库与配置 IPC 离散处理器注册完成')
}
