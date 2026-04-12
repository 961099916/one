import fs from 'fs'
import path from 'path'
import { shell } from 'electron'
import { spawn, exec } from 'child_process'
import log from 'electron-log'
import { LogTags } from '../../constants'
import { sendTextToWindowsProcess } from '../../utils/windowsAutomation'

export interface TdxMinuteData {
  time: string
  open: number
  high: number
  low: number
  close: number
  amount: number
  volume: number
}

export interface TdxDayData {
  date: string // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  amount: number
  volume: number
}

export interface MarketOverview {
  bigMeat: number // 涨幅 > 10%
  bigFace: number // 跌幅 > 10%
  profitAvg: number // 昨日涨停今日平均收益
}

export class TdxService {
  private static instance: TdxService

  static getInstance(): TdxService {
    if (!TdxService.instance) {
      TdxService.instance = new TdxService()
    }
    return TdxService.instance
  }

  /**
   * 鲁棒的路径解析：自动识别通达信根目录或 vipdoc 目录
   */
  private resolveVipdocPath(basePath: string): string {
    if (!basePath) return ''
    try {
      // 如果路径本身就是 vipdoc 或以此结尾，直接返回
      if (basePath.toLowerCase().endsWith('vipdoc')) return basePath
      
      // 尝试在当前目录下找 vipdoc
      const possibleVipdoc = path.join(basePath, 'vipdoc')
      if (fs.existsSync(possibleVipdoc)) return possibleVipdoc
      
      // 返回原始路径，让后续的 exists 检查逻辑处理
      return basePath
    } catch {
      return basePath
    }
  }

  /**
   * 查找日线文件（兼容大小写）
   */
  private findDayFile(vipdocPath: string, market: string, fileName: string): string | null {
    const ldayPath = path.join(vipdocPath, market.toLowerCase(), 'lday')
    if (!fs.existsSync(ldayPath)) return null

    // 直接尝试全小写拼接
    const fullPath = path.join(ldayPath, fileName.toLowerCase())
    if (fs.existsSync(fullPath)) return fullPath

    // 尝试大写
    const upperPath = path.join(ldayPath, fileName.toUpperCase())
    if (fs.existsSync(upperPath)) return upperPath

    // 目录扫描（最慢但最稳）
    try {
      const files = fs.readdirSync(ldayPath)
      const target = fileName.toLowerCase()
      const found = files.find(f => f.toLowerCase() === target)
      return found ? path.join(ldayPath, found) : null
    } catch {
      return null
    }
  }

  /**
   * 读取分时数据
   */
  async getMinuteData(params: { tdxPath: string, symbol: string, date: string, period?: '1' | '5' }): Promise<TdxMinuteData[]> {
    const { tdxPath, symbol, date, period = '5' } = params
    try {
      const vipdocPath = this.resolveVipdocPath(tdxPath)
      const market = symbol.substring(0, 2).toLowerCase()
      const code = symbol.substring(2)
      const fileName = `${market}${code}.${period === '1' ? 'lc1' : 'lc5'}`
      const filePath = path.join(vipdocPath, market, 'fzline', fileName)

      if (!fs.existsSync(filePath)) return []

      const buffer = fs.readFileSync(filePath)
      const recordSize = 32
      const results: TdxMinuteData[] = []
      const [targetY, targetM, targetD] = date.split('-').map(Number)
      const targetDateCode1 = (targetY - 2004) * 2048 + targetM * 100 + targetD
      const targetDateCode2 = ((targetY - 2004) << 9) | (targetM << 5) | targetD

      for (let i = 0; i < buffer.length; i += recordSize) {
        const dateCode = buffer.readUInt16LE(i)
        if (dateCode === targetDateCode1 || dateCode === targetDateCode2) {
          const timeCode = buffer.readUInt16LE(i + 2)
          const timeStr = `${Math.floor(timeCode/60).toString().padStart(2, '0')}:${(timeCode%60).toString().padStart(2, '0')}`
          results.push({
            time: `${date} ${timeStr}`,
            open: buffer.readFloatLE(i + 4),
            high: buffer.readFloatLE(i + 8),
            low: buffer.readFloatLE(i + 12),
            close: buffer.readFloatLE(i + 16),
            amount: buffer.readFloatLE(i + 20),
            volume: buffer.readInt32LE(i + 24)
          })
        }
      }
      return results
    } catch { return [] }
  }

  async openStock(symbol: string, tdxPath?: string) {
    const code = symbol.replace(/[^0-9]/g, '')
    
    log.info(`[TdxService] openStock: platform=${process.platform}, tdxPath=${tdxPath}, code=${code}`)

    // 如果是 Windows 且提供了路径，使用 PowerShell 脚本直连（强制置顶并模拟键盘输入）
    if (process.platform === 'win32' && tdxPath && fs.existsSync(tdxPath)) {
      try {
        let exePath = tdxPath
        if (fs.statSync(tdxPath).isDirectory()) {
          exePath = path.join(tdxPath, 'tdxw.exe')
        }

        log.info(`[TdxService] Attempting to open stock via PowerShell: ${exePath} for ${code}`)
        
        const success = await sendTextToWindowsProcess(exePath, code, 'tdxw')
        return { success, error: success ? undefined : '底层进程联动执行中断' }
      } catch (err) {
        log.error(`[TdxService] Failed to execute windows automation: ${err instanceof Error ? err.message : String(err)}`)
        return { success: false, error: err instanceof Error ? err.message : String(err) }
      }
    }

    log.warn(`[TdxService] 未配置有效的通达信路径或处于非 Windows 平台，停止拉起`);
    return { success: false, error: '请配置有效的通达信可执行路径，并确保当前环境支持此操作' }
  }

  async getDayData(tdxPath: string, symbol: string, limit: number = 30): Promise<TdxDayData[]> {
    const vipdocPath = this.resolveVipdocPath(tdxPath)
    const market = symbol.substring(0, 2)
    const fileName = `${symbol.toLowerCase()}.day`
    const filePath = this.findDayFile(vipdocPath, market, fileName)

    if (!filePath) return []
    const buffer = fs.readFileSync(filePath)
    const recordSize = 32
    const count = Math.floor(buffer.length / recordSize)
    const results: TdxDayData[] = []
    for (let i = Math.max(0, count - limit); i < count; i++) {
        const offset = i * recordSize
        const rawDate = buffer.readUInt32LE(offset)
        const dateStr = rawDate.toString()
        results.push({
          date: `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`,
          open: buffer.readUInt32LE(offset + 4) / 100,
          high: buffer.readUInt32LE(offset + 8) / 100,
          low: buffer.readUInt32LE(offset + 12) / 100,
          close: buffer.readUInt32LE(offset + 16) / 100,
          amount: buffer.readFloatLE(offset + 20),
          volume: buffer.readUInt32LE(offset + 24)
        })
    }
    return results
  }

  async getIndicesStats(tdxPath: string, limit: number = 30) {
    const shData = await this.getDayData(tdxPath, 'SH000001', limit + 1)
    const szData = await this.getDayData(tdxPath, 'SZ399001', limit + 1)
    const stats: Record<string, { turnover: number, changePercent: number }> = {}
    const szMap = new Map(szData.map(d => [d.date, d]))

    shData.forEach((sh, idx) => {
      const sz = szMap.get(sh.date)
      if (!sz) return
      let cp = 0
      if (idx > 0) {
          const prev = shData[idx - 1]
          if (prev.close) cp = (sh.close - prev.close) / prev.close
      }
      stats[sh.date] = { turnover: (sh.amount + sz.amount) * 10000, changePercent: cp }
    })
    return stats
  }

  async getMarketOverview(tdxPath: string, dates: string[], yesterdayLimitUps: Record<string, string[]>) {
    const results: Record<string, MarketOverview> = {}
    dates.forEach(d => results[d] = { bigMeat: 0, bigFace: 0, profitAvg: 0 })

    const vipdocPath = this.resolveVipdocPath(tdxPath)
    if (!fs.existsSync(vipdocPath)) return results

    const markets = ['sh', 'sz']
    const recordSize = 32

    for (const m of markets) {
      const ldayPath = path.join(vipdocPath, m, 'lday')
      if (!fs.existsSync(ldayPath)) continue
      const files = fs.readdirSync(ldayPath).filter(f => f.toLowerCase().endsWith('.day'))
      
      for (const f of files) {
        try {
          const fPath = path.join(ldayPath, f)
          const stats = fs.statSync(fPath)
          if (stats.size < recordSize * 2) continue
          const symbol = m.toUpperCase() + f.split('.')[0].replace(/[^0-9]/g, '')
          
          const fd = fs.openSync(fPath, 'r')
          const buffer = Buffer.alloc(recordSize * (dates.length + 2))
          const readSize = Math.min(stats.size, buffer.length)
          fs.readSync(fd, buffer, 0, readSize, stats.size - readSize)
          fs.closeSync(fd)

          const fileRecords: TdxDayData[] = []
          for (let i = 0; i < readSize; i += recordSize) {
            const rawDate = buffer.readUInt32LE(i)
            const ds = rawDate.toString()
            fileRecords.push({
              date: `${ds.substring(0,4)}-${ds.substring(4,6)}-${ds.substring(6,8)}`,
              open: buffer.readUInt32LE(i+4)/100, high: buffer.readUInt32LE(i+8)/100, low: buffer.readUInt32LE(i+12)/100,
              close: buffer.readUInt32LE(i+16)/100, amount: buffer.readFloatLE(i+20), volume: buffer.readUInt32LE(i+24)
            })
          }

          dates.forEach((date, di) => {
            const curIdx = fileRecords.findIndex(r => r.date === date)
            if (curIdx > 0) {
              const cur = fileRecords[curIdx], pre = fileRecords[curIdx-1]
              if (!pre.close) return
              const chg = (cur.close - pre.close) / pre.close
              if (chg >= 0.098) results[date].bigMeat++
              if (chg <= -0.098) results[date].bigFace++
              const prevDate = dates[di+1]
              if (prevDate && yesterdayLimitUps[prevDate]?.includes(symbol)) results[date].profitAvg += chg
            }
          })
        } catch(e) {}
      }
    }

    dates.forEach((d, i) => {
      const pd = dates[i+1], count = yesterdayLimitUps[pd]?.length || 0
      if (count > 0) results[d].profitAvg /= count
    })
    return results
  }
}
