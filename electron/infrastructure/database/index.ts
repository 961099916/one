/**
 * 数据库模块统一导出
 */
export { initDB, closeDB, sessionOps, messageOps, marketDataOps, tradingDayOps, stockPoolOps, surgeOps, getDBInstance } from './sqlite'
export type { SessionRow, MessageRow, MarketDataRow, StockPoolRow, SurgePlateRow, SurgeStockRow } from './sqlite'
export {
  initStorageDirs,
  getStorageRoot,
  getFilesDir,
  getImagesDir,
  getModelsDir,
  saveFile,
  saveImage,
  saveBase64Image,
  getAbsolutePath,
  fileExists,
  deleteFile,
  readFile,
  getFileSize,
} from './fileStorage'
