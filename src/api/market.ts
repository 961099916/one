import { getAPI } from './index'
import type { MarketDataRow, StockPoolRow, TradingDayRow } from '@common/types/market'

export const marketApi = {
  // 市场数据
  getMarketData: (params?: { startDate?: string, endDate?: string }) => getAPI()?.db.getMarketData(params),
  syncMarketData: (params: { startDate: string, endDate: string, force?: boolean }) => getAPI()?.db.syncMarketData(params),
  
  // 交易日
  getAllTradingDays: () => getAPI()?.db.getAllTradingDays(),
  getLatestTradingDay: () => getAPI()?.db.getLatestTradingDay(),
  updateTradingDay: (params: { date: string, isTrading: boolean }) => getAPI()?.db.updateTradingDay(params),
  
  // 股票池
  getStockPool: (params: { poolName: string, date: string }) => getAPI()?.db.getStockPool(params),
  syncStockPool: (params: { poolName: string, date: string }) => getAPI()?.db.syncStockPool(params),
  
  // 情绪周期
  getSentimentCycle: (params: { limit?: number }) => getAPI()?.db.getSentimentCycle(params),
  
  // 连板高标与热点数据
  getSurgePlates: (params: { date: string, timestamp?: number }) => getAPI()?.db.getSurgePlates(params),
  getSurgeStocks: (params: { date: string, timestamp?: number }) => getAPI()?.db.getSurgeStocks(params),
  getSurgeHistoricalDates: () => getAPI()?.db.getSurgeHistoricalDates(),
  syncSurgeData: (date: string) => getAPI()?.db.syncSurgeData(date),
  getLatestSurgeTimestamp: (date: string) => getAPI()?.db.getLatestSurgeTimestamp(date),
  
  // 批量同步
  batchSyncXuangubao: (params: { startDate: string, endDate: string, force?: boolean }) => getAPI()?.db.batchSyncXuangubao(params)
}
