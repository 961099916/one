import fs from 'fs'
import { spawn } from 'child_process'
import { shell } from 'electron'
import log from 'electron-log'
import { TongHuaShunConfig, LogTags } from '@common/constants'

export class TongHuaShunService {
  private static instance: TongHuaShunService

  static getInstance(): TongHuaShunService {
    if (!TongHuaShunService.instance) {
      TongHuaShunService.instance = new TongHuaShunService()
    }
    return TongHuaShunService.instance
  }

  /**
   * 在同花顺中打开股票
   * @param stockCode 股票代码（如：600519、300033）
   * @param thsPath 同花顺安装路径（可选）
   */
  async openStock(stockCode: string, thsPath?: string): Promise<{ success: boolean; error?: string }> {
    try {
      log.info(`${LogTags.TONGHUASHUN} 尝试打开股票: ${stockCode}`)

      // 格式化股票代码
      const cleanCode = stockCode.replace(/[^0-9]/g, '')

      // 如果是 Windows 且提供了路径，优先使用路径直连
      if (process.platform === 'win32' && thsPath && fs.existsSync(thsPath)) {
        try {
          log.info(`${LogTags.TONGHUASHUN} Attempting to open stock via path: ${thsPath} -s ${cleanCode}`)
          spawn(thsPath, ['-s', cleanCode], { detached: true, stdio: 'ignore' }).unref()
          return { success: true }
        } catch (err) {
          log.error(`${LogTags.TONGHUASHUN} Failed to spawn THS process: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      // 方法1: 使用 amihexin:// scheme
      const url1 = `${TongHuaShunConfig.SCHEMES.AMIHEXIN}${TongHuaShunConfig.PATHS.STOCK}${cleanCode}`

      // 方法2: 使用 fls:// scheme（从搜索结果看到）
      const url2 = `${TongHuaShunConfig.SCHEMES.FLS}${TongHuaShunConfig.PATHS.STOCK_PAGE}${cleanCode}`

      // 方法3: 简单的 amihexin:// 直接唤起
      const url3 = TongHuaShunConfig.SCHEMES.AMIHEXIN

      log.info(`${LogTags.TONGHUASHUN} 尝试 URL 1: ${url1}`)
      try {
        await shell.openExternal(url1)
        log.info(`${LogTags.TONGHUASHUN} 成功唤起同花顺`)
        return { success: true }
      } catch (err1) {
        log.info(`${LogTags.TONGHUASHUN} URL 1 失败，尝试 URL 2: ${url2}`)
        try {
          await shell.openExternal(url2)
          log.info(`${LogTags.TONGHUASHUN} 成功唤起同花顺`)
          return { success: true }
        } catch (err2) {
          log.info(`${LogTags.TONGHUASHUN} URL 2 失败，尝试 URL 3: ${url3}`)
          try {
            await shell.openExternal(url3)
            log.info(`${LogTags.TONGHUASHUN} 成功唤起同花顺`)
            return { success: true }
          } catch (err3) {
            log.error(`${LogTags.TONGHUASHUN} 所有 URL 都失败了`)
            return {
              success: false,
              error: TongHuaShunConfig.ERROR_MESSAGES.NOT_INSTALLED,
            }
          }
        }
      }
    } catch (err) {
      log.error(`${LogTags.TONGHUASHUN} 打开股票失败:`, err)
      return {
        success: false,
        error: err instanceof Error ? err.message : TongHuaShunConfig.ERROR_MESSAGES.OPEN_FAILED,
      }
    }
  }

  /**
   * 打开同花顺应用（不指定股票）
   */
  async openApp(): Promise<{ success: boolean; error?: string }> {
    try {
      log.info(`${LogTags.TONGHUASHUN} 尝试打开同花顺应用`)
      await shell.openExternal(TongHuaShunConfig.SCHEMES.AMIHEXIN)
      log.info(`${LogTags.TONGHUASHUN} 成功唤起同花顺`)
      return { success: true }
    } catch (err) {
      log.error(`${LogTags.TONGHUASHUN} 打开应用失败:`, err)
      return {
        success: false,
        error: err instanceof Error ? err.message : TongHuaShunConfig.ERROR_MESSAGES.NOT_INSTALLED,
      }
    }
  }
}
