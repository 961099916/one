import fs from 'fs'
import path from 'path'
import { shell } from 'electron'
import log from 'electron-log'
import { LogTags } from '../../constants'

export interface TdxMinuteData {
  time: string
  open: number
  high: number
  low: number
  close: number
  amount: number
  volume: number
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
   * 读取通达信分时数据 (.lc5 或 .lc1)
   * @param tdxPath 通达信 vipdoc 目录路径
   * @param symbol 股票代码 (如 SH600519)
   * @param date 目标日期 (YYYY-MM-DD)
   * @param period 周期: '1' 为 1分钟, '5' 为 5分钟
   */
  async getMinuteData(
    tdxPath: string,
    symbol: string,
    date: string,
    period: '1' | '5' = '5'
  ): Promise<TdxMinuteData[]> {
    try {
      if (!tdxPath) {
        throw new Error('未配置通达信路径')
      }

      // 1. 确定文件路径
      // 符号处理: SH600519 -> sh, 600519
      const market = symbol.substring(0, 2).toLowerCase() // sh or sz
      const code = symbol.substring(2)
      const fileName = `${market}${code}.${period === '1' ? 'lc1' : 'lc5'}`
      const filePath = path.join(tdxPath, market, 'fzline', fileName)

      log.info(`${LogTags.TDX} 正在读取文件: ${filePath}, 目标日期: ${date}`)

      if (!fs.existsSync(filePath)) {
        log.warn(`${LogTags.TDX} 文件不存在: ${filePath}`)
        return []
      }

      // 2. 读取文件并解析
      const buffer = fs.readFileSync(filePath)
      const recordSize = 32
      const results: TdxMinuteData[] = []

      // 目标日期的编码
      const [targetY, targetM, targetD] = date.split('-').map(Number)

      // 计算两种可能的日期编码
      const targetDateCode1 = (targetY - 2004) * 2048 + targetM * 100 + targetD
      const targetDateCode2 = ((targetY - 2004) << 9) | (targetM << 5) | targetD
      const targetDateCode = Math.max(targetDateCode1, targetDateCode2)

      log.info(`${LogTags.TDX} 目标日期: ${date}, 编码1: ${targetDateCode1}, 编码2: ${targetDateCode2}`)
      log.info(`${LogTags.TDX} 文件大小: ${buffer.length} 字节, 记录数: ${buffer.length / recordSize}`)

      // 调试：打印第一条记录
      if (buffer.length >= recordSize) {
        const rawDate = buffer.readUInt16LE(0)
        log.info(`${LogTags.TDX} 文件第一条记录原始日期代码: ${rawDate}`)
      }

      for (let i = 0; i < buffer.length; i += recordSize) {
        if (i + recordSize > buffer.length) break

        const dateCode = buffer.readUInt16LE(i)

        // 匹配任意一种编码
        if (dateCode === targetDateCode1 || dateCode === targetDateCode2) {
          const timeCode = buffer.readUInt16LE(i + 2)
          const open = buffer.readFloatLE(i + 4)
          const high = buffer.readFloatLE(i + 8)
          const low = buffer.readFloatLE(i + 12)
          const close = buffer.readFloatLE(i + 16)
          const amount = buffer.readFloatLE(i + 20)
          const volume = buffer.readInt32LE(i + 24)

          // 转换时间代码 (minutes from 00:00) 为 HH:mm
          const hour = Math.floor(timeCode / 60)
          const minute = timeCode % 60
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          results.push({
            time: `${date} ${timeStr}`,
            open,
            high,
            low,
            close,
            amount,
            volume
          })
        } else if (dateCode > targetDateCode) {
          // 由于文件通常是按时间排序的，如果当前日期已经超过目标日期，可以提前停止（可选）
          // 但为了保险（考虑到有些文件可能不是严格有序），我们继续扫描或者根据具体情况优化
          // 这里简单处理，继续扫描所有记录，或者如果确定是有序的就 break
          // TDX 数据文件通常是有序的
          // break 
        }
      }

      log.info(`${LogTags.TDX} 解析完成，找到 ${results.length} 条记录`)
      return results
    } catch (err) {
      log.error(`${LogTags.TDX} 获取分时数据失败:`, err)
      throw err
    }
  }

  /**
   * 唤起通达信并跳转到指定股票
   * @param symbol 股票代码 (如 SH600519)
   */
  async openStock(symbol: string): Promise < { success: boolean; error?: string } > {
      try {
        log.info(`${LogTags.TDX} 尝试唤起通达信: ${symbol}`)

      // 通达信 URL Scheme (根据常见配置)
      // 尝试常用的几种协议，由系统分发
      const schemes = ['tdx', 'newtdx', 'tdxw']
      let lastError: Error | null = null

      for(const scheme of schemes) {
          try {
            // 去掉前缀（如 SH600519 -> 600519）或者直接使用 symbol，取决于协议要求
            // 多数通达信协议支持带市场前缀或纯代码
            const code = symbol.replace(/[^0-9]/g, '')
            const url = `${scheme}://${code}`
            log.info(`${LogTags.TDX} 尝试唤起协议: ${url}`)
            await shell.openExternal(url)
            return { success: true }
          } catch (err) {
            lastError = err as Error
            continue
          }
        }
      
      throw lastError || new Error('未找到可用的通达信协议')
      } catch(err) {
        log.error(`${LogTags.TDX} 唤起通达信失败:`, err)
        return {
          success: false,
          error: err instanceof Error ? err.message : '无法打开通达信'
        }
      }
    }
  }
