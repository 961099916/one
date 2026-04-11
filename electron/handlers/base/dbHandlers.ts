/**
 * 数据库 IPC 处理器
 *
 * 将 SQLite 和 electron-store 操作通过 IPC 暴露给渲染进程
 * 渲染进程通过 window.electronAPI.db.* 和 window.electronAPI.config.* 调用
 */
import { ipcMain } from 'electron'
import { sessionOps, messageOps, marketDataOps, tradingDayOps, stockPoolOps, surgeOps } from '../../infrastructure/database'
import { appConfigOps } from '../../infrastructure/store'
import { IpcChannel } from '../../constants'
import { XuanguBaoService } from '../../services/integration/xuangubaoService'
import log from 'electron-log'

/**
 * 初始化数据库 IPC 处理器
 */
export function initDbHandlers(): void {
  // ==================== 会话操作（SQLite） ====================

  /** 获取所有会话 */
  ipcMain.handle(IpcChannel.DB_GET_SESSIONS, () => {
    log.info('[IPC] 调用 DB_GET_SESSIONS')
    try {
      return sessionOps.getAll()
    } catch (err) {
      log.error('[DB IPC] get-sessions 失败:', err)
      throw err
    }
  })

  /** 创建会话 */
  ipcMain.handle(IpcChannel.DB_CREATE_SESSION, (_event, session) => {
    log.info('[IPC] 调用 DB_CREATE_SESSION, 参数:', session)
    try {
      sessionOps.create(session)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] create-session 失败:', err)
      throw err
    }
  })

  /** 更新会话 */
  ipcMain.handle(IpcChannel.DB_UPDATE_SESSION, (_event, id: string, updates) => {
    log.info('[IPC] 调用 DB_UPDATE_SESSION, id:', id)
    try {
      sessionOps.update(id, updates)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] update-session 失败:', err)
      throw err
    }
  })

  /** 删除会话（级联删消息） */
  ipcMain.handle(IpcChannel.DB_DELETE_SESSION, (_event, id: string) => {
    log.info('[IPC] 调用 DB_DELETE_SESSION, id:', id)
    try {
      sessionOps.delete(id)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] delete-session 失败:', err)
      throw err
    }
  })

  // ==================== 消息操作（SQLite） ====================

  /** 获取会话消息 */
  ipcMain.handle(IpcChannel.DB_GET_MESSAGES, (_event, sessionId: string) => {
    log.info('[IPC] 调用 DB_GET_MESSAGES, sessionId:', sessionId)
    try {
      return messageOps.getBySession(sessionId)
    } catch (err) {
      log.error('[DB IPC] get-messages 失败:', err)
      throw err
    }
  })

  /** 添加消息 */
  ipcMain.handle(
    IpcChannel.DB_ADD_MESSAGE,
    (_event, sessionId: string, role: string, content: string, createdAt: number) => {
      log.info('[IPC] 调用 DB_ADD_MESSAGE, sessionId:', sessionId, 'role:', role)
      try {
        const id = messageOps.add(sessionId, role, content, createdAt)
        return { success: true, id }
      } catch (err) {
        log.error('[DB IPC] add-message 失败:', err)
        throw err
      }
    }
  )

  /** 更新最后一条消息内容（流式输出追加） */
  ipcMain.handle(
    IpcChannel.DB_UPDATE_LAST_MESSAGE,
    (_event, sessionId: string, content: string) => {
      try {
        messageOps.updateLastContent(sessionId, content)
        return { success: true }
      } catch (err) {
        log.error('[DB IPC] update-last-message 失败:', err)
        throw err
      }
    }
  )

  /** 清空会话消息 */
  ipcMain.handle(IpcChannel.DB_CLEAR_MESSAGES, (_event, sessionId: string) => {
    log.info('[IPC] 调用 DB_CLEAR_MESSAGES, sessionId:', sessionId)
    try {
      messageOps.deleteBySession(sessionId)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] clear-messages 失败:', err)
      throw err
    }
  })

  // ==================== 市场数据操作（SQLite） ====================

  /** 获取指定范围的市场分时数据（用于折线图） */
  ipcMain.handle(IpcChannel.DB_GET_MARKET_DATA, (_event, payload) => {
    const { startDate, endDate } = payload || {}
    try {
      if (!startDate || !endDate) {
        log.info('[IPC] 调用 DB_GET_MARKET_DATA, 获取全部数据')
        return marketDataOps.getAll()
      }
      log.info('[IPC] 调用 DB_GET_MARKET_DATA, 范围:', startDate, '至', endDate)
      return marketDataOps.getByDateRange(startDate, endDate)
    } catch (err) {
      log.error('[DB IPC] get-market-data 失败:', err)
      throw err
    }
  })

  /** 同步指定日期的市场数据（支持范围及强制同步） */
  ipcMain.handle(IpcChannel.DB_SYNC_MARKET_DATA, async (_event, payload) => {
    const { startDate, endDate, force = false } = payload || {}
    log.info('[IPC] 调用 DB_SYNC_MARKET_DATA, 范围:', startDate, '至', endDate, 'force:', force)
    const results = { success: true, count: 0, messages: [] as string[] }
    
    if (!startDate || !endDate) return { success: false, message: '日期参数缺失' }
    
    try {
      const xuanguBao = XuanguBaoService.getInstance()
      
      // 生成日期列表
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dateList: string[] = []
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dateStr = String(d.getDate()).padStart(2, '0')
        dateList.push(`${y}-${m}-${dateStr}`)
      }

      for (const date of dateList) {
        // 1. 拦截逻辑
        if (!force && tradingDayOps.isNonTrading(date)) {
          log.info(`[Sync] 日期 ${date} 已知休市，跳过`)
          continue
        }

        // 如果是强制同步，先删除本地该日期的旧数据，确保重新同步能写入（避免 IGNORE 逻辑导致无法更新字段）
        if (force) {
          marketDataOps.deleteByDate(date)
        }

        // 2. 发起请求
        const data = await xuanguBao.getMarketIndicator(date)

        // 3. 严格校验：判断返回数据的实际日期与查询日期是否匹配
        let isRealTradingDay = false
        let validData: any[] = []
        
        if (data && data.length > 0) {
          // 将第一个点的时间戳转换为本地 YYYY-MM-DD 字符串进行比对
          const firstPointDate = new Date(data[0].timestamp * 1000).toLocaleDateString('sv')
          if (firstPointDate === date) {
            isRealTradingDay = true
            validData = data.map(item => ({
              timestamp: item.timestamp,
              rise_count: item.rise_count,
              fall_count: item.fall_count,
              limit_up_count: item.limit_up_count,
              limit_down_count: item.limit_down_count,
              limit_up_broken_count: item.limit_up_broken_count,
              limit_up_broken_ratio: item.limit_up_broken_ratio,
              market_temperature: item.market_temperature
            }))
          } else {
            log.info(`[Sync] 日期 ${date} 的 API 返回数据所属日期为 ${firstPointDate}，判定 ${date} 为休市`)
          }
        }

        // 4. 处理结果
        if (isRealTradingDay) {
          marketDataOps.saveBatch(date, validData)
          tradingDayOps.saveStatus(date, true)
          results.count += validData.length
        } else {
          // 仅对历史日期进行“休市”标记；今日若无匹配数据则跳过，不标记以允许后续开盘后重试
          const todayStr = new Date().toLocaleDateString('sv')
          if (date < todayStr) {
            tradingDayOps.saveStatus(date, false)
            log.info(`[Sync] 历史日期 ${date} 已确认为休市并缓存状态`)
          } else {
            log.info(`[Sync] 目标日期 ${date} 尚无匹配的分时数据，跳过`)
          }
        }
      }

      return results
    } catch (err) {
      log.error('[DB IPC] sync-market-data 失败:', err)
      throw err
    }
  })

  /** 获取所有交易日记录（用于日历管理） */
  ipcMain.handle(IpcChannel.DB_GET_ALL_TRADING_DAYS, () => {
    log.info('[IPC] 调用 DB_GET_ALL_TRADING_DAYS')
    try {
      return tradingDayOps.getAll()
    } catch (err) {
      log.error('[DB IPC] get-all-trading-days 失败:', err)
      throw err
    }
  })

  /** 手动更新特定日期的交易状态 */
  ipcMain.handle(IpcChannel.DB_UPDATE_TRADING_DAY, (_event, { date, isTrading }) => {
    log.info(`[IPC] 调用 DB_UPDATE_TRADING_DAY, 日期: ${date}, 状态: ${isTrading}`)
    try {
      tradingDayOps.saveStatus(date, isTrading)
      return { success: true }
    } catch (err) {
      log.error('[DB IPC] update-trading-day 失败:', err)
      throw err
    }
  })

  // ==================== 股票池数据操作（SQLite） ====================

  /** 获取指定日期和池子的股票数据 */
  ipcMain.handle(IpcChannel.DB_GET_STOCK_POOL, (_event, { poolName, date }) => {
    log.info(`[IPC] 调用 DB_GET_STOCK_POOL, 池子: ${poolName}, 日期: ${date}`)
    try {
      return stockPoolOps.getByPoolAndDate(poolName, date)
    } catch (err) {
      log.error('[DB IPC] get-stock-pool 失败:', err)
      throw err
    }
  })

  /** 同步指定日期和池子的股票数据 */
  ipcMain.handle(IpcChannel.DB_SYNC_STOCK_POOL, async (_event, { poolName, date }) => {
    log.info(`[IPC] 调用 DB_SYNC_STOCK_POOL, 池子: ${poolName}, 日期: ${date}`)
    try {
      const xuanguBao = XuanguBaoService.getInstance()
      const success = await xuanguBao.syncStockPool(poolName, date)
      return { success }
    } catch (err) {
      log.error('[DB IPC] sync-stock-pool 失败:', err)
      throw err
    }
  })

  // ==================== 情绪周期聚合操作 ====================
  
  /** 获取全量情绪周期数据 */
  ipcMain.handle(IpcChannel.DB_GET_SENTIMENT_CYCLE, async (_event, params: { limit?: number } = {}) => {
    const { limit = 15 } = params
    log.info(`[IPC] 调用 DB_GET_SENTIMENT_CYCLE, limit: ${limit}`)
    
    try {
      // 1. 获取最近的交易日列表
      const days = tradingDayOps.getLatestTradingDays(limit)
      if (days.length === 0) return { days: [], matrix: [], stats: [] }
      
      const dateList = days.map(d => d.date)
      const startDate = dateList[dateList.length - 1]
      const endDate = dateList[0]

      // 2. 获取这些日期的市场指标
      const stats = marketDataOps.getByDateRange(startDate, endDate)
      
      // 3. 获取这些日期的涨停简况
      const poolRecords = stockPoolOps.getLatestPoolRecordsByDates('limit_up', dateList)
      
      return {
        days: dateList,
        stats,
        poolRecords
      }
    } catch (err) {
      log.error('[DB IPC] get-sentiment-cycle 失败:', err)
      throw err
    }
  })

  // ==================== 每日热点专题数据（追涨热力板） ====================

  /** 获取指定日期的热点板块 */
  ipcMain.handle(IpcChannel.DB_GET_SURGE_PLATES, (_event, params: { date: string, timestamp?: number }) => {
    log.info(`[IPC] 调用 DB_GET_SURGE_PLATES, 参数:`, params)
    try {
      return surgeOps.getPlatesByDate(params)
    } catch (err) {
      log.error('[DB IPC] get-surge-plates 失败:', err)
      throw err
    }
  })

  /** 获取指定日期的热点个股 */
  ipcMain.handle(IpcChannel.DB_GET_SURGE_STOCKS, (_event, params: { date: string, timestamp?: number }) => {
    log.info(`[IPC] 调用 DB_GET_SURGE_STOCKS, 参数:`, params)
    try {
      return surgeOps.getStocksByDate(params)
    } catch (err) {
      log.error('[DB IPC] get-surge-stocks 失败:', err)
      throw err
    }
  })

  /** 获取指定日期下所有快照时间点 */
  ipcMain.handle(IpcChannel.DB_GET_SURGE_TIMESTAMPS, (_event, date: string) => {
    log.info(`[IPC] 调用 DB_GET_SURGE_TIMESTAMPS, 日期: ${date}`)
    try {
      return surgeOps.getTimestampsByDate(date)
    } catch (err) {
      log.error('[DB IPC] get-surge-timestamps 失败:', err)
      throw err
    }
  })

  /** 获取所有历史热点日期 */
  ipcMain.handle(IpcChannel.DB_GET_SURGE_HISTORICAL_DATES, () => {
    log.info(`[IPC] 调用 DB_GET_SURGE_HISTORICAL_DATES`)
    try {
      return surgeOps.getHistoricalDates()
    } catch (err) {
      log.error('[DB IPC] get-surge-historical-dates 失败:', err)
      throw err
    }
  })

  /** 同步指定日期的每日热点数据 */
  ipcMain.handle(IpcChannel.DB_SYNC_SURGE_DATA, async (_event, date: string) => {
    log.info(`[IPC] 调用 DB_SYNC_SURGE_DATA, 日期: ${date}`)
    try {
      const xuanguBao = XuanguBaoService.getInstance()
      const success = await xuanguBao.syncSurgeData(date)
      return { success }
    } catch (err) {
      log.error('[DB IPC] sync-surge-data 失败:', err)
      throw err
    }
  })

  /** 获取指定日期下最新的热点数据时间戳 */
  ipcMain.handle(IpcChannel.DB_GET_LATEST_SURGE_TIMESTAMP, (_event, date: string) => {
    log.info(`[IPC] 调用 DB_GET_LATEST_SURGE_TIMESTAMP, 日期: ${date}`)
    try {
      return surgeOps.getLatestTimestampByDate(date)
    } catch (err) {
      log.error('[DB IPC] get-latest-surge-timestamp 失败:', err)
      throw err
    }
  })

  /** 一键批量同步选股通数据（指标 + 所有股票池） */
  ipcMain.handle(IpcChannel.DB_BATCH_SYNC_XUANGUBAO, async (_event, payload) => {
    const { startDate, endDate, force = false } = payload || {}
    log.info('[IPC] 调用 DB_BATCH_SYNC_XUANGUBAO, 范围:', startDate, '至', endDate, 'force:', force)
    
    if (!startDate || !endDate) return { success: false, message: '日期参数缺失' }

    const results = { 
      success: true, 
      dateCount: 0, 
      syncCount: 0,
      errors: [] as string[] 
    }

    try {
      const xuanguBao = XuanguBaoService.getInstance()
      const pools = ['limit_up', 'broken_limit_up', 'limit_down', 'strong_stock', 'yesterday_limit_up']
      
      // 生成日期列表
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dateList: string[] = []
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateList.push(d.toISOString().split('T')[0])
      }

      for (const date of dateList) {
        // 1. 交易日判定逻辑 (复用市场指标同步的拦截逻辑)
        if (!force && tradingDayOps.isNonTrading(date)) {
          continue
        }

        results.dateCount++
        log.info(`[Batch Sync] 正在同步日期 ${date}...`)

        // A. 同步市场指标
        try {
          if (force) marketDataOps.deleteByDate(date)
          const indicatorData = await xuanguBao.getMarketIndicator(date)
          
          let isRealTradingDay = false
          if (indicatorData && indicatorData.length > 0) {
            const firstPointDate = new Date(indicatorData[0].timestamp * 1000).toLocaleDateString('sv')
            if (firstPointDate === date) {
              isRealTradingDay = true
              marketDataOps.saveBatch(date, indicatorData)
              tradingDayOps.saveStatus(date, true)
              results.syncCount++
            }
          }

          if (!isRealTradingDay) {
            const todayStr = new Date().toLocaleDateString('sv')
            if (date < todayStr) {
              tradingDayOps.saveStatus(date, false)
            }
            // 如果不是交易日，跳过股票池同步
            continue 
          }
        } catch (err) {
          log.error(`[Batch Sync] 同步 ${date} 市场指标失败:`, err)
          results.errors.push(`${date} 市场指标同步失败`)
        }

        // B. 同步所有股票池
        for (const poolName of pools) {
          try {
            await xuanguBao.syncStockPool(poolName, date)
          } catch (err) {
            log.error(`[Batch Sync] 同步 ${date} 股票池 ${poolName} 失败:`, err)
            results.errors.push(`${date} ${poolName} 同步失败`)
          }
        }

        // C. 同步每日热点数据
        try {
          await xuanguBao.syncSurgeData(date)
        } catch (err) {
          log.error(`[Batch Sync] 同步 ${date} 每日热点失败:`, err)
          results.errors.push(`${date} 每日热点同步失败`)
        }
      }

      return results
    } catch (err) {
      log.error('[DB IPC] batch-sync-xuangubao 失败:', err)
      throw err
    }
  })

  // ==================== 配置操作（electron-store） ====================

  /** 获取单个配置 */
  ipcMain.handle(IpcChannel.CONFIG_GET, (_event, key: string) => {
    log.info('[IPC] 调用 CONFIG_GET, key:', key)
    try {
      return appConfigOps.get(key as never)
    } catch (err) {
      log.error('[Config IPC] get 失败:', err)
      throw err
    }
  })

  /** 设置配置 */
  ipcMain.handle(IpcChannel.CONFIG_SET, (_event, key: string, value: unknown) => {
    log.info('[IPC] 调用 CONFIG_SET, key:', key)
    try {
      appConfigOps.set(key as never, value as never)
      return { success: true }
    } catch (err) {
      log.error('[Config IPC] set 失败:', err)
      throw err
    }
  })

  /** 获取所有配置 */
  ipcMain.handle(IpcChannel.CONFIG_GET_ALL, () => {
    log.info('[IPC] 调用 CONFIG_GET_ALL')
    try {
      return appConfigOps.getAll()
    } catch (err) {
      log.error('[Config IPC] get-all 失败:', err)
      throw err
    }
  })

  /** 重置配置 */
  ipcMain.handle(IpcChannel.CONFIG_RESET, () => {
    log.info('[IPC] 调用 CONFIG_RESET')
    try {
      appConfigOps.reset()
      return { success: true }
    } catch (err) {
      log.error('[Config IPC] reset 失败:', err)
      throw err
    }
  })

  log.info('[DB IPC] 数据库 IPC 处理器注册完成')
}
