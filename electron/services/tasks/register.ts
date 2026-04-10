/**
 * 注册所有任务处理器
 */
import log from 'electron-log'
import { registerTaskHandler } from './index'
import { cleanupTaskHandler } from './cleanupTask'
import { backupTaskHandler } from './backupTask'
import { syncMarketDataTaskHandler } from './syncMarketDataTask'

export function registerAllTaskHandlers(): void {
  log.info('[TaskRegistry] 开始注册任务处理器')

  // 注册内置任务处理器
  registerTaskHandler(cleanupTaskHandler)
  registerTaskHandler(backupTaskHandler)
  registerTaskHandler(syncMarketDataTaskHandler)

  log.info('[TaskRegistry] 任务处理器注册完成')
}
