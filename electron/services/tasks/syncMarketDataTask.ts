/**
 * 同步选股通市场数据任务处理器
 */
import log from 'electron-log'
import type { TaskHandler } from './index'
import type { ScheduledTask } from '../../core/cronService'
import { XuanguBaoService } from '../integration/xuangubaoService'
import { marketDataOps } from '../../infrastructure/database'

export const syncMarketDataTaskHandler: TaskHandler = {
  name: 'sync_market_data',

  async execute(task: ScheduledTask): Promise<void> {
    log.info('[SyncMarketDataTask] 开始同步市场数据:', task.name)

    try {
      const xuanguBao = XuanguBaoService.getInstance()

      // 获取今日日期
      const today = new Date().toISOString().split('T')[0]
      log.info('[SyncMarketDataTask] 同步日期:', today)

      // 获取市场数据
      const data = await xuanguBao.getMarketIndicator(today)

      if (!data) {
        log.warn('[SyncMarketDataTask] 未获取到市场数据')
        return
      }

      // 保存到数据库
      marketDataOps.save(today, data.rise_count, data.fall_count)

      log.info(
        '[SyncMarketDataTask] 市场数据同步完成',
        `涨停: ${data.rise_count}`,
        `跌停: ${data.fall_count}`
      )
    } catch (err) {
      log.error('[SyncMarketDataTask] 同步市场数据失败:', err)
      throw err
    }
  },
}
